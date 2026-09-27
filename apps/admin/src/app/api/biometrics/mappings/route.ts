import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAnyRole } from '@/lib/auth/authorization';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * GET /api/biometrics/mappings
 * Lists all employee biometric mappings with employee and device names.
 */
export async function GET() {
  try {
    const actor = await requireAnyRole(['owner', 'admin', 'hr', 'operations head']);
    const supabaseAdmin = getAdminClient();

    const { data, error } = await supabaseAdmin
      .from('employee_biometric_mappings')
      .select(`
        id,
        employee_id,
        device_id,
        biometric_user_id,
        status,
        notes,
        created_at,
        updated_at,
        team_members (name, email, role),
        biometric_devices (device_name, branch_location)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * POST /api/biometrics/mappings
 * Creates or updates an employee biometric identity mapping.
 */
export async function POST(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = getAdminClient();

    const body = await request.json();
    const { employeeId, deviceId, biometricUserId, status, notes } = body;

    if (!employeeId || !biometricUserId) {
      return NextResponse.json(
        { error: 'employeeId and biometricUserId are required.' },
        { status: 400 }
      );
    }

    const parsedEmpId = parseInt(String(employeeId), 10);
    if (isNaN(parsedEmpId)) {
      return NextResponse.json({ error: 'Invalid employee ID format.' }, { status: 400 });
    }

    // 1. Verify employee exists in team_members
    const { data: employee, error: empError } = await supabaseAdmin
      .from('team_members')
      .select('id, name, email')
      .eq('id', parsedEmpId)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found in directory.' }, { status: 404 });
    }

    // 2. If deviceId is specified, verify device exists
    if (deviceId) {
      const { data: device, error: devError } = await supabaseAdmin
        .from('biometric_devices')
        .select('id, device_name')
        .eq('id', deviceId)
        .single();

      if (devError || !device) {
        return NextResponse.json({ error: 'Specified biometric device not found.' }, { status: 404 });
      }
    }

    const cleanBiometricUserId = String(biometricUserId).trim();

    // 3. Check for existing mapping conflict
    let conflictQuery = supabaseAdmin
      .from('employee_biometric_mappings')
      .select('id, employee_id')
      .eq('biometric_user_id', cleanBiometricUserId);

    if (deviceId) {
      conflictQuery = conflictQuery.eq('device_id', deviceId);
    } else {
      conflictQuery = conflictQuery.is('device_id', null);
    }

    const { data: existingConflict } = await conflictQuery.single();

    let resultMapping;
    if (existingConflict) {
      // Update existing mapping
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('employee_biometric_mappings')
        .update({
          employee_id: parsedEmpId,
          status: status || 'active',
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConflict.id)
        .select()
        .single();

      if (updateError) throw updateError;
      resultMapping = updated;
    } else {
      // Insert new mapping
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('employee_biometric_mappings')
        .insert({
          employee_id: parsedEmpId,
          device_id: deviceId || null,
          biometric_user_id: cleanBiometricUserId,
          status: status || 'active',
          notes: notes || null
        })
        .select()
        .single();

      if (insertError) throw insertError;
      resultMapping = inserted;
    }

    // Record audit log
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
      user_id: actor.authUserId,
      action: 'BIOMETRIC_MAPPING_SAVED',
      resource_type: 'employee_biometric_mappings',
      resource_id: resultMapping.id,
      details: {
        employee_name: employee.name,
        employee_id: parsedEmpId,
        biometric_user_id: cleanBiometricUserId,
        device_id: deviceId || 'GLOBAL',
        status: status || 'active',
        saved_by: actor.email,
        timestamp: new Date().toISOString()
      }
    });

    if (auditError) {
      return NextResponse.json({ error: `Mapping succeeded, but failed to write audit log: ${auditError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Biometric ID '${cleanBiometricUserId}' mapped to ${employee.name}.`,
      mapping: resultMapping
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

/**
 * DELETE /api/biometrics/mappings
 * Deactivates or removes a biometric mapping.
 */
export async function DELETE(request: Request) {
  try {
    const actor = await requireAnyRole(['owner', 'admin']);
    const supabaseAdmin = getAdminClient();

    const { searchParams } = new URL(request.url);
    const mappingId = searchParams.get('id');

    if (!mappingId) {
      return NextResponse.json({ error: 'Mapping ID is required.' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('employee_biometric_mappings')
      .delete()
      .eq('id', mappingId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Biometric mapping removed successfully.'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
