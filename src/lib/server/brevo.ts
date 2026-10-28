const BREVO_EMAIL_URL = 'https://api.brevo.com/v3/smtp/email';

type BrevoSettings = {
  apiKey: string;
  senderEmail: string;
  senderName: string;
  templateId?: number;
};

export async function sendBrevoVerificationCode(
  recipientEmail: string,
  code: string,
  settings: BrevoSettings,
  send: typeof fetch = fetch
) {
  const response = await send(BREVO_EMAIL_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': settings.apiKey
    },
    body: JSON.stringify(settings.templateId
      ? {
          sender: { email: settings.senderEmail, name: settings.senderName },
          to: [{ email: recipientEmail }],
          templateId: settings.templateId,
          params: { CODE: code, EXPIRES_MINUTES: 10 }
        }
      : {
          sender: { email: settings.senderEmail, name: settings.senderName },
          to: [{ email: recipientEmail }],
          subject: 'Your BuildTogether sign-in code',
          htmlContent: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>BuildTogether sign-in</h2><p>Use this code to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`
        })
  });

  if (!response.ok) {
    throw new Error(`Brevo rejected the sign-in email (HTTP ${response.status}). Check the sender, API key permissions, and transactional email activation.`);
  }
}
