import { headers } from 'next/headers';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(limit: number, windowMs: number): Promise<{ success: boolean; ip: string }> {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, ip };
  }
  
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, ip };
  }
  
  if (record.count >= limit) {
    return { success: false, ip };
  }
  
  record.count += 1;
  return { success: true, ip };
}
