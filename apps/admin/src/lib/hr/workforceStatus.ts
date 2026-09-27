import { createClient } from '@supabase/supabase-js';

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours * 60) + (minutes || 0);
}

export async function calculateWorkforceStatus(
  supabaseAdmin: any,
  targetDate: string,
  isAdmin: boolean,
  requesterId: number
) {
  // Default to PKT offset if targetDate is just YYYY-MM-DD
  const pktDate = new Date();

  // 1. Employees (active)
  let empQuery = supabaseAdmin.from('team_members').select('id, name, email').eq('status', 'active');
  if (!isAdmin) {
    empQuery = empQuery.eq('id', requesterId);
  }
  const { data: employees, error: empError } = await empQuery;
  if (empError) console.error("empQuery error:", empError);

  // 2. Holidays
  const { data: holidays } = await supabaseAdmin
    .from('hr_holidays')
    .select('*')
    .eq('date', targetDate)
    .eq('is_active', true);
  
  const isHoliday = holidays && holidays.length > 0;

  // 3. Leaves
  const { data: leaves } = await supabaseAdmin
    .from('leave_requests')
    .select('employee_id')
    .eq('status', 'APPROVED')
    .lte('start_date', targetDate)
    .gte('end_date', targetDate);
  const onLeaveEmpIds = new Set(leaves?.map((l: any) => l.employee_id) || []);

  // 4. Shifts and Assignments
  const { data: assignments } = await supabaseAdmin
    .from('employee_shifts')
    .select('employee_id, shifts(*)')
    .lte('effective_from', targetDate)
    .or(`effective_to.is.null,effective_to.gte.${targetDate}`);

  const shiftMap = new Map();
  assignments?.forEach((a: any) => {
    shiftMap.set(a.employee_id, a.shifts);
  });

  // 5. Attendance Records
  const { data: attendances } = await supabaseAdmin
    .from('employee_attendance')
    .select('*')
    .eq('date', targetDate);
  
  const attMap = new Map();
  attendances?.forEach((a: any) => {
    attMap.set(a.employee_id, a);
  });

  // Calculate status
  const summary = {
    totalEmployees: employees?.length || 0,
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    holiday: 0,
    incomplete: 0,
    earlyDeparture: 0
  };

  const results = employees?.map((emp: any) => {
    const isLeave = onLeaveEmpIds.has(emp.id);
    const shift = shiftMap.get(emp.id);
    
    const att = attMap.get(emp.id.toString()) || attMap.get(emp.id);

    let status = 'ABSENT';
    let late_minutes = 0;
    let early_departure_minutes = 0;
    let worked_minutes = 0;
    let overtime_minutes = 0;

    if (isLeave) {
      status = 'ON_LEAVE';
      summary.onLeave++;
    } else if (isHoliday) {
      status = 'HOLIDAY';
      summary.holiday++;
    } else if (!shift) {
      status = 'NOT_SCHEDULED';
    } else {
      if (att) {
        const checkIn = new Date(att.created_at);
        const inH = checkIn.getUTCHours() + 5; // PKT
        const inM = checkIn.getUTCMinutes();
        const checkInMinutes = (inH % 24) * 60 + inM;
        
        const shiftStartMin = parseTimeToMinutes(shift.start_time);
        const shiftEndMin = parseTimeToMinutes(shift.end_time);
        const grace = shift.grace_period_minutes || 0;

        if (checkInMinutes > shiftStartMin + grace) {
          status = 'LATE';
          late_minutes = checkInMinutes - shiftStartMin;
          summary.late++;
        } else {
          status = 'PRESENT';
          summary.present++;
        }

        if (att.check_out_time) {
          const checkOut = new Date(att.check_out_time);
          const outH = checkOut.getUTCHours() + 5;
          const outM = checkOut.getUTCMinutes();
          let checkOutMinutes = (outH % 24) * 60 + outM;

          if (checkOutMinutes < checkInMinutes) {
             checkOutMinutes += 24 * 60;
          }
          
          let adjustedShiftEnd = shiftEndMin;
          if (shiftEndMin < shiftStartMin) {
            adjustedShiftEnd += 24 * 60;
          }

          worked_minutes = checkOutMinutes - checkInMinutes;

          if (checkOutMinutes < adjustedShiftEnd) {
            early_departure_minutes = adjustedShiftEnd - checkOutMinutes;
            status = 'EARLY_DEPARTURE';
            summary.earlyDeparture++;
          }

          const requiredMinutes = (adjustedShiftEnd - shiftStartMin) - (shift.break_duration_minutes || 0);
          const extraMinutes = worked_minutes - requiredMinutes;

          if (extraMinutes > (shift.overtime_threshold_minutes || 0)) {
            overtime_minutes = extraMinutes;
          }
        } else {
          // Check if shift is over and no checkout
          const currentPktMins = (pktDate.getUTCHours() + 5) * 60 + pktDate.getUTCMinutes();
          let adjustedShiftEnd = shiftEndMin;
          if (shiftEndMin < shiftStartMin) adjustedShiftEnd += 24 * 60;
          
          if (currentPktMins > adjustedShiftEnd) {
            status = 'PRESENT_INCOMPLETE';
            summary.incomplete++;
          }
        }
      } else {
        status = 'ABSENT';
        summary.absent++;
      }
    }

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      shift_name: shift?.name,
      status,
      check_in: att?.created_at,
      check_out: att?.check_out_time,
      metrics: {
        worked_minutes,
        late_minutes,
        early_departure_minutes,
        overtime_minutes
      }
    };
  });

  return {
    date: targetDate,
    summary,
    employees: results
  };
}
