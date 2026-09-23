import { SupabaseClient } from '@supabase/supabase-js';
import { IdentityResolutionResult } from './types';

/**
 * BiometricIdentityResolver
 * Resolves a raw physical terminal user identity (device_id + biometric_user_id)
 * to a verified KeyAbroad team member ID.
 * 
 * Never trusts client/device-supplied employee IDs.
 * Supports device-scoped biometric IDs and global fallback mappings.
 */
export class BiometricIdentityResolver {
  /**
   * Resolves a biometric ID to a team member
   */
  public static async resolve(
    deviceId: string,
    biometricUserId: string,
    supabase: SupabaseClient
  ): Promise<IdentityResolutionResult> {
    if (!deviceId || !biometricUserId) {
      return {
        status: 'INVALID_DEVICE',
        error: 'Missing deviceId or biometricUserId parameters.'
      };
    }

    const cleanBiometricUserId = String(biometricUserId).trim();

    // 1. Verify device exists and is active
    const { data: device, error: deviceError } = await supabase
      .from('biometric_devices')
      .select('id, status, device_name')
      .eq('id', deviceId)
      .single();

    if (deviceError || !device) {
      return {
        status: 'INVALID_DEVICE',
        error: `Biometric device '${deviceId}' is not registered in the system.`
      };
    }

    if (device.status === 'inactive') {
      return {
        status: 'INVALID_DEVICE',
        error: `Biometric device '${device.device_name}' (${deviceId}) is currently deactivated.`
      };
    }

    // 2. Query device-scoped biometric mapping first
    let { data: mapping, error: mapError } = await supabase
      .from('employee_biometric_mappings')
      .select('id, employee_id, status')
      .eq('device_id', deviceId)
      .eq('biometric_user_id', cleanBiometricUserId)
      .single();

    // 3. Fallback to global mapping (device_id IS NULL) if no device-scoped mapping exists
    if (!mapping) {
      const { data: globalMapping } = await supabase
        .from('employee_biometric_mappings')
        .select('id, employee_id, status')
        .is('device_id', null)
        .eq('biometric_user_id', cleanBiometricUserId)
        .single();

      mapping = globalMapping;
    }

    if (!mapping) {
      return {
        status: 'UNMATCHED',
        error: `No biometric identity mapping found for terminal user '${cleanBiometricUserId}' on device '${device.device_name}'.`
      };
    }

    if (mapping.status !== 'active') {
      return {
        status: 'INACTIVE',
        mappingId: mapping.id,
        error: `Biometric mapping for user '${cleanBiometricUserId}' is currently deactivated.`
      };
    }

    // 4. Resolve team_members record
    const { data: employee, error: empError } = await supabase
      .from('team_members')
      .select('id, name, status, email')
      .eq('id', mapping.employee_id)
      .single();

    if (empError || !employee) {
      return {
        status: 'UNMATCHED',
        mappingId: mapping.id,
        error: `Mapped employee record (ID: ${mapping.employee_id}) does not exist in directory.`
      };
    }

    if (employee.status !== 'active') {
      return {
        status: 'INACTIVE',
        employeeId: employee.id,
        employeeName: employee.name,
        mappingId: mapping.id,
        error: `Employee '${employee.name}' is marked as '${employee.status}'. Attendance rejected.`
      };
    }

    return {
      status: 'MATCHED',
      employeeId: employee.id,
      employeeName: employee.name,
      mappingId: mapping.id
    };
  }
}
