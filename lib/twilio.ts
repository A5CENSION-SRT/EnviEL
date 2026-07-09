import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const smsEnabled = process.env.SMS_ENABLED === 'true';

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
}

if (!smsEnabled) {
  console.log('SMS functionality is disabled via SMS_ENABLED environment variable.');
}

// Validate accountSid format before creating client
const isValidAccountSid = accountSid && accountSid.startsWith('AC');
if (accountSid && !isValidAccountSid) {
  console.error('Invalid TWILIO_ACCOUNT_SID format. Must start with "AC". SMS functionality disabled.');
}

const client = isValidAccountSid && authToken && smsEnabled ? twilio(accountSid, authToken) : null;

// Rate limiting: prevent SMS spam
const SMS_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between SMS
let lastSMSTime = 0;

export interface SMSOptions {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SMSOptions): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio client not initialized. Check environment variables.');
    return { success: false, error: 'Twilio not configured' };
  }

  // Rate limiting check
  const now = Date.now();
  const timeSinceLastSMS = now - lastSMSTime;
  if (timeSinceLastSMS < SMS_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((SMS_COOLDOWN_MS - timeSinceLastSMS) / 60000);
    console.log(`SMS skipped due to rate limit. Next SMS allowed in ${remainingMinutes} minutes.`);
    return { success: false, skipped: true, error: `Rate limited. Try again in ${remainingMinutes} minutes` };
  }

  try {
    await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });

    lastSMSTime = now;
    console.log(`SMS sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && twilioPhoneNumber && smsEnabled);
}
