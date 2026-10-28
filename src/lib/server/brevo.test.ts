import { describe, expect, it, vi } from 'vitest';
import { sendBrevoVerificationCode } from './brevo';

const settings = {
  apiKey: 'test-api-key',
  senderEmail: 'sender@example.com',
  senderName: 'BuildTogether'
};

describe('Brevo sign-in email', () => {
  it('sends the code to the chosen recipient with the verified sender', async () => {
    const send = vi.fn(async () => new Response(JSON.stringify({ messageId: 'test-message' }), { status: 201 }));

    await sendBrevoVerificationCode('student@byui.edu', '123456', settings, send as typeof fetch);

    expect(send).toHaveBeenCalledOnce();
    const [url, request] = send.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(request.method).toBe('POST');
    expect(request.headers).toMatchObject({ 'api-key': 'test-api-key', 'content-type': 'application/json' });
    expect(JSON.parse(String(request.body))).toMatchObject({
      sender: { email: 'sender@example.com', name: 'BuildTogether' },
      to: [{ email: 'student@byui.edu' }]
    });
    expect(String(request.body)).toContain('123456');
  });

  it('rejects provider errors without exposing the API key', async () => {
    const send = vi.fn(async () => new Response('{}', { status: 401 }));

    await expect(sendBrevoVerificationCode('student@byui.edu', '123456', settings, send as typeof fetch))
      .rejects.toThrow('HTTP 401');
  });

  it('uses a Brevo template and passes a fresh code as a parameter', async () => {
    const send = vi.fn(async () => new Response(JSON.stringify({ messageId: 'test-message' }), { status: 201 }));

    await sendBrevoVerificationCode('student@byui.edu', '654321', { ...settings, templateId: 27 }, send as typeof fetch);

    const [, request] = send.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(request.body));
    expect(body).toMatchObject({
      to: [{ email: 'student@byui.edu' }],
      templateId: 27,
      params: { CODE: '654321', EXPIRES_MINUTES: 10 }
    });
    expect(body.htmlContent).toBeUndefined();
  });
});
