import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to_email, to_phone, subject, message, type } = body;

    // TODO: Add Resend API Key and uncomment to enable real emails
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    
    if (to_email) {
      console.log(`[EMAIL SIMULATION] Sending to: ${to_email}`);
      console.log(`[EMAIL SIMULATION] Subject: ${subject}`);
      console.log(`[EMAIL SIMULATION] Body: ${message}`);
      
      // await resend.emails.send({
      //   from: 'admissions@keyabroad.com',
      //   to: to_email,
      //   subject: subject,
      //   html: `<p>${message}</p>`
      // });
    }

    // TODO: Add Twilio Account SID and Auth Token to enable real WhatsApp
    // import twilio from 'twilio';
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    if (to_phone) {
      console.log(`[WHATSAPP SIMULATION] Sending to: ${to_phone}`);
      console.log(`[WHATSAPP SIMULATION] Body: ${message}`);

      // await client.messages.create({
      //   body: message,
      //   from: 'whatsapp:+14155238886', // Twilio Sandbox Number
      //   to: `whatsapp:${to_phone}`
      // });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification processed (Simulation Mode active until API keys are provided)' 
    });

  } catch (error: any) {
    console.error('Notification Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
