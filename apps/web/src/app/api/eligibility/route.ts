import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const eligibilitySchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(50).optional(),
  cgpa: z.number().min(0).max(4.0),
  ieltsScore: z.number().min(0).max(9.0),
  studyGapYears: z.number().min(0).max(20),
  budget: z.number().min(0),
  preferredCountryId: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const rateLimitResult = await checkRateLimit(5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const ip = rateLimitResult.ip;

    const body = await request.json();
    const result = eligibilitySchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const formData = result.data;

    if (!supabaseServiceRoleKey) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: leadId, error } = await supabaseAdmin.rpc('submit_public_lead', {
      p_first_name: formData.firstName,
      p_last_name: formData.lastName,
      p_email: formData.email,
      p_phone: formData.phone || null,
      p_cgpa: formData.cgpa,
      p_ielts_score: formData.ieltsScore,
      p_study_gap_years: formData.studyGapYears,
      p_budget: formData.budget,
      p_preferred_country_id: formData.preferredCountryId || null,
    });

    if (error) {
      console.error(`Error inserting eligibility lead for IP ${ip}:`, error.message);
      // We don't fail the request here to still show results, but log the error
    }

    // Business Logic: Convert PKR budget to various currencies for matching
    const budgetPKR = formData.budget;
    const budgetUSD = budgetPKR / 278;
    const budgetGBP = budgetPKR / 350;
    const budgetEUR = budgetPKR / 300;
    const budgetAUD = budgetPKR / 185;
    const budgetCAD = budgetPKR / 205;

    const currencyFilter = `and(currency.eq.USD,tuition_fee.lte.${budgetUSD}),and(currency.eq.GBP,tuition_fee.lte.${budgetGBP}),and(currency.eq.EUR,tuition_fee.lte.${budgetEUR}),and(currency.eq.AUD,tuition_fee.lte.${budgetAUD}),and(currency.eq.CAD,tuition_fee.lte.${budgetCAD})`;

    const query = supabaseAdmin
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .lte('minimum_cgpa', formData.cgpa)
      .or(currencyFilter);
      
    const { count, error: qError } = await query;
    if (qError) {
      console.error("Error matching programs:", qError.message);
    }

    const matchedCount = count || 0;
    let status = 'needs_review';
    const suggestions: string[] = [];

    if (matchedCount > 10) {
      status = 'eligible';
      suggestions.push("You have an extremely strong profile for your budget.");
    } else if (matchedCount > 0) {
      status = 'likely_eligible';
      suggestions.push(`We found ${matchedCount} programs that perfectly fit your academic and financial profile.`);
    } else {
      status = 'not_met';
      suggestions.push("We recommend increasing your budget or considering alternative destinations.");
    }

    if (formData.cgpa < 2.5) {
      status = 'needs_review';
      suggestions.push("Your CGPA may require you to consider pathway or foundation programs.");
    }

    return NextResponse.json({ 
      success: true, 
      result: {
        status,
        matchedPrograms: matchedCount,
        suggestions
      }
    });
  } catch (error: any) {
    console.error("Unexpected error in eligibility route:", error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
