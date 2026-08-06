import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  // Get UTC hours
  const utcHours = now.getUTCHours();
  // PKT is UTC+5 (Pakistan Standard Time)
  const pktHours = (utcHours + 5) % 24;
  
  return NextResponse.json({
    pktHours,
    iso: now.toISOString()
  });
}
