import crypto from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';
import { CredentialGenerationResult, DeviceAuthResult } from './types';

/**
 * Generates a cryptographically random device API key with standard prefix.
 * Format: ka_dev_<48 hex chars>
 * Prefix recorded: ka_dev_<first 6 chars>...
 */
export function generateMachineToken(): { rawToken: string; keyPrefix: string; keyHash: string } {
  const randomSecret = crypto.randomBytes(24).toString('hex');
  const rawToken = `ka_dev_${randomSecret}`;
  const keyPrefix = `ka_dev_${randomSecret.slice(0, 6)}...`;
  const keyHash = hashMachineToken(rawToken);

  return { rawToken, keyPrefix, keyHash };
}

/**
 * Computes SHA-256 hash of a machine token.
 */
export function hashMachineToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Secure constant-time string comparison to prevent timing attacks.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * DeviceCredentialManager
 * Manages the creation, verification, rotation, and revocation of machine credentials.
 */
export class DeviceCredentialManager {
  public static generateRawApiKey(): string {
    return generateMachineToken().rawToken;
  }

  public static extractPrefix(rawKey: string): string {
    if (!rawKey || !rawKey.startsWith('ka_dev_')) return 'ka_dev_invalid';
    const secret = rawKey.slice(7);
    return `ka_dev_${secret.slice(0, 6)}...`;
  }

  public static hashKey(rawKey: string): string {
    return hashMachineToken(rawKey);
  }

  public static timingSafeEqual(a: string, b: string): boolean {
    return timingSafeEqualStrings(a, b);
  }

  /**
   * Generates and stores a new device credential.
   * Returns the one-time raw token which must be shown once to the admin.
   */
  public static async createCredential(
    deviceId: string,
    keyName: string,
    actor: string,
    supabase: SupabaseClient,
    options?: { expiresAt?: Date }
  ): Promise<CredentialGenerationResult> {
    const { rawToken, keyPrefix, keyHash } = generateMachineToken();

    const { data: credential, error } = await supabase
      .from('device_credentials')
      .insert({
        device_id: deviceId,
        key_name: keyName || 'Primary Device API Key',
        key_prefix: keyPrefix,
        key_hash: keyHash,
        status: 'active',
        expires_at: options?.expiresAt ? options.expiresAt.toISOString() : null,
        created_by: actor,
      })
      .select('id')
      .single();

    if (error || !credential) {
      throw new Error(`Failed to create device credential: ${error?.message || 'Database error'}`);
    }

    // Also update biometric_devices.api_key_hash for backward compatibility
    await supabase
      .from('biometric_devices')
      .update({ api_key_hash: keyHash })
      .eq('id', deviceId);

    // Audit log
    try {
      await supabase.from('activity_logs').insert({
        action_type: 'BIOMETRIC_DEVICE_KEY_CREATED',
        description: `Created machine credential (${keyPrefix}) for device ${deviceId}`,
        employee_name: actor,
      });
    } catch {
      // Non-blocking audit failure
    }

    return {
      credentialId: credential.id,
      deviceId,
      keyPrefix,
      rawApiKey: rawToken,
    };
  }

  /**
   * Verifies an incoming raw token against the device credentials registry.
   * Validates credential hash, status, expiration, and associated device status.
   * Returns generic masked error on any failure to prevent credential enumeration.
   */
  public static async verifyCredential(
    rawToken: string,
    supabase: SupabaseClient,
    claimedDeviceId?: string
  ): Promise<DeviceAuthResult> {
    if (!rawToken || typeof rawToken !== 'string' || !rawToken.startsWith('ka_dev_')) {
      return { authenticated: false, error: 'Unauthorized: Invalid machine credentials.' };
    }

    const keyHash = hashMachineToken(rawToken);

    // 1. Query active credential by hash
    let query = supabase
      .from('device_credentials')
      .select('id, device_id, status, expires_at, key_hash')
      .eq('key_hash', keyHash);

    if (claimedDeviceId) {
      query = query.eq('device_id', claimedDeviceId);
    }

    const { data: cred, error: credError } = await query.single();

    // Fallback: Check legacy biometric_devices.api_key_hash if not in device_credentials yet
    if (!cred || credError) {
      const { data: legacyDevice } = await supabase
        .from('biometric_devices')
        .select('id, device_name, status, api_key_hash')
        .eq('api_key_hash', keyHash)
        .single();

      if (legacyDevice) {
        if (claimedDeviceId && legacyDevice.id !== claimedDeviceId) {
          return { authenticated: false, error: 'Unauthorized: Invalid machine credentials.' };
        }
        if (legacyDevice.status === 'inactive' || legacyDevice.status === 'disabled') {
          return { authenticated: false, deviceId: legacyDevice.id, error: 'Unauthorized: Terminal is disabled.' };
        }

        const nowIso = new Date().toISOString();
        await supabase
          .from('biometric_devices')
          .update({
            last_authenticated_at: nowIso,
            last_heartbeat: nowIso,
            consecutive_error_count: 0,
          })
          .eq('id', legacyDevice.id);

        return {
          authenticated: true,
          deviceId: legacyDevice.id,
          deviceName: legacyDevice.device_name,
          status: legacyDevice.status,
        };
      }

      return { authenticated: false, error: 'Unauthorized: Invalid machine credentials.' };
    }

    // Verify constant-time hash match
    if (!this.timingSafeEqual(cred.key_hash, keyHash)) {
      return { authenticated: false, error: 'Unauthorized: Invalid machine credentials.' };
    }

    // Verify credential status
    if (cred.status !== 'active') {
      return {
        authenticated: false,
        deviceId: cred.device_id,
        credentialId: cred.id,
        error: 'Unauthorized: Invalid machine credentials.',
      };
    }

    // Check expiration
    if (cred.expires_at && new Date(cred.expires_at).getTime() < Date.now()) {
      await supabase
        .from('device_credentials')
        .update({ status: 'expired' })
        .eq('id', cred.id);

      return {
        authenticated: false,
        deviceId: cred.device_id,
        credentialId: cred.id,
        error: 'Unauthorized: Invalid machine credentials.',
      };
    }

    // 2. Query Device Status
    const { data: device, error: devError } = await supabase
      .from('biometric_devices')
      .select('id, device_name, status')
      .eq('id', cred.device_id)
      .single();

    if (devError || !device) {
      return { authenticated: false, error: 'Unauthorized: Invalid machine credentials.' };
    }

    if (device.status === 'inactive' || device.status === 'disabled') {
      return {
        authenticated: false,
        deviceId: device.id,
        deviceName: device.device_name,
        error: 'Unauthorized: Terminal is disabled.',
      };
    }

    // 3. Update Telemetry
    const nowIso = new Date().toISOString();
    await supabase
      .from('device_credentials')
      .update({ last_used_at: nowIso })
      .eq('id', cred.id);

    await supabase
      .from('biometric_devices')
      .update({
        last_authenticated_at: nowIso,
        consecutive_error_count: 0,
      })
      .eq('id', device.id);

    return {
      authenticated: true,
      deviceId: device.id,
      deviceName: device.device_name,
      status: device.status,
      credentialId: cred.id,
    };
  }

  /**
   * Rotates a device credential:
   * 1. If gracePeriodHours > 0, sets expiration on existing active credentials instead of immediate revocation.
   * 2. Issues a new cryptographically random credential.
   * 3. Logs the action in activity logs.
   */
  public static async rotateCredential(
    deviceId: string,
    keyName: string,
    gracePeriodHours: number,
    actor: string,
    supabase: SupabaseClient
  ): Promise<CredentialGenerationResult> {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (gracePeriodHours > 0) {
      const graceExpiresAt = new Date(now + gracePeriodHours * 3600 * 1000).toISOString();
      await supabase
        .from('device_credentials')
        .update({
          expires_at: graceExpiresAt,
        })
        .eq('device_id', deviceId)
        .eq('status', 'active');
    } else {
      await supabase
        .from('device_credentials')
        .update({
          status: 'revoked',
          revoked_at: nowIso,
          revoked_by: actor,
        })
        .eq('device_id', deviceId)
        .eq('status', 'active');
    }

    // Create fresh credential
    const result = await this.createCredential(deviceId, keyName, actor, supabase);

    // Audit log
    try {
      await supabase.from('activity_logs').insert({
        action_type: 'BIOMETRIC_DEVICE_KEY_ROTATED',
        description: `Rotated machine credential for device ${deviceId}. New key prefix: ${result.keyPrefix} (grace period: ${gracePeriodHours}h)`,
        employee_name: actor,
      });
    } catch {}

    return result;
  }

  /**
   * Revokes a specific credential.
   */
  public static async revokeCredential(
    credentialId: string,
    actor: string,
    supabase: SupabaseClient
  ): Promise<boolean> {
    const nowIso = new Date().toISOString();

    const { data: cred, error } = await supabase
      .from('device_credentials')
      .update({
        status: 'revoked',
        revoked_at: nowIso,
        revoked_by: actor,
      })
      .eq('id', credentialId)
      .select('device_id, key_prefix')
      .single();

    if (error || !cred) return false;

    // Audit log
    try {
      await supabase.from('activity_logs').insert({
        action_type: 'BIOMETRIC_DEVICE_KEY_REVOKED',
        description: `Revoked machine credential (${cred.key_prefix}) for device ${cred.device_id}`,
        employee_name: actor,
      });
    } catch {}

    return true;
  }
}
