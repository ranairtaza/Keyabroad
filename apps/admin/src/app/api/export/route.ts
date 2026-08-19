import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  const supabase = await createClient();
  let data: any = null;
  let headers: string[] = [];
  let rows: string[][] = [];

  try {
    if (type === 'leads') {
      const { data: leadsData } = await supabase.rpc('get_analytics_leads', { p_start_date: startDate || null, p_end_date: endDate || null });
      headers = ['Source', 'Count'];
      rows = leadsData?.by_source ? Object.entries(leadsData.by_source) : [];
      // Also add status
      rows.push(['---', '---']);
      rows.push(['Status', 'Count']);
      if (leadsData?.by_status) {
        rows.push(...Object.entries(leadsData.by_status) as any);
      }
    } else if (type === 'applications') {
      const { data: appsData } = await supabase.rpc('get_analytics_applications', { p_start_date: startDate || null, p_end_date: endDate || null });
      headers = ['Status', 'Count'];
      rows = appsData?.by_status ? Object.entries(appsData.by_status) : [];
    } else if (type === 'team') {
      const { data: teamData } = await supabase.rpc('get_analytics_counselors', { p_start_date: startDate || null, p_end_date: endDate || null });
      headers = ['Counselor Name', 'Branch', 'Total Leads', 'Total Students', 'Tasks Completed', 'Tasks Overdue'];
      const counselors = Array.isArray(teamData) ? teamData : [];
      rows = counselors.map((c: any) => [
        c.full_name || 'Unknown',
        c.branch || 'Head Office',
        c.total_leads?.toString() || '0',
        c.total_students?.toString() || '0',
        c.tasks_completed?.toString() || '0',
        c.tasks_overdue?.toString() || '0'
      ]);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="keyabroad_export_${type}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
