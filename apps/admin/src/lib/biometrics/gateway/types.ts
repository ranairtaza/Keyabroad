import { NormalizedBiometricEvent } from '../types';

export type CredentialStatus = 'active' | 'revoked' | 'expired';

export interface DeviceCredential {
  id: string;
  device_id: string;
  key_name: string;
  key_prefix: string;
  key_hash: string;
  status: CredentialStatus;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  last_used_at: string | null;
  created_by: string; // Canonical auth.users(id) UUID
  created_at: string;
  updated_at: string;
}

export interface CredentialGenerationResult {
  credentialId: string;
  deviceId: string;
  keyPrefix: string;
  rawApiKey: string; // ONLY returned once upon generation; never stored
}

export interface DeviceAuthResult {
  authenticated: boolean;
  deviceId?: string;
  deviceName?: string;
  status?: string;
  error?: string;
  credentialId?: string;
  mode?: 'LIVE' | 'TEST';
  testExpiresAt?: string | null;
}

export type DeviceHealthState = 'ONLINE' | 'OFFLINE' | 'NEVER_CONNECTED' | 'DISABLED' | 'ERROR';

export interface ComputedDeviceHealth {
  state: DeviceHealthState;
  lastHeartbeat: string | null;
  lastEventAt: string | null;
  lastAuthenticatedAt: string | null;
  lastSync: string | null;
  errorCount: number; // Historical cumulative errors
  consecutiveErrorCount: number; // Consecutive failures for health evaluation
  lastError: string | null;
  offlineThresholdMinutes: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedEvents?: NormalizedBiometricEvent[];
}

export interface BiometricAdapter {
  name: string;
  validate(rawPayload: unknown): ValidationResult;
  normalize(rawPayload: unknown, deviceId: string): NormalizedBiometricEvent[];
}
