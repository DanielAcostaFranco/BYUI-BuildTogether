import { randomBytes, randomInt, scrypt as nodeScrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import type { Db } from 'mongodb';
import { isDemoAddress } from '$lib/auth-policy';
import { sendBrevoVerificationCode } from '$lib/server/brevo';

const scrypt = promisify(nodeScrypt);
const OTP_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createVerificationCode() {
  return randomInt(100000, 1000000).toString();
}

export async function hashSecret(secret: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(secret, salt, 64)) as Buffer;
  return {
    salt: salt.toString('base64url'),
    hash: derivedKey.toString('base64url')
  };
}

export async function verifySecret(secret: string, saltValue: string, hashValue: string) {
  const salt = Buffer.from(saltValue, 'base64url');
  const expected = Buffer.from(hashValue, 'base64url');
  const actual = (await scrypt(secret, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function verificationExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function sessionExpiresAt() {
  return new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
}

export function sessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export async function getSessionUser(database: Db, sessionToken: string | undefined) {
  if (!sessionToken) return null;

  const session = await database.collection('sessions').findOne({
    tokenHash: hashSessionToken(sessionToken),
    expiresAt: { $gt: new Date() }
  });

  if (!session) return null;

  return database.collection('users').findOne({ id: session.userId });
}

export async function sendVerificationCode(email: string, code: string, demoUser = false) {
  if (dev && demoUser && isDemoAddress(email)) {
    console.info(`[BuildTogether auth] Demo code for ${email}: ${code}`);
    return { delivered: false, developmentCode: code };
  }

  if (env.AUTH_EMAIL_MODE === 'local') {
    if (dev) {
      console.info(`[BuildTogether auth] Development code for ${email}: ${code}`);
      return { delivered: false, developmentCode: code };
    }

    throw new Error('AUTH_EMAIL_MODE=local is only available during local development.');
  }

  if (env.AUTH_EMAIL_MODE !== 'brevo') throw new Error('Set AUTH_EMAIL_MODE=brevo to send real sign-in emails.');
  if (!env.BREVO_API_KEY || !env.BREVO_SENDER_EMAIL) throw new Error('Brevo is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');

  const templateId = env.BREVO_TEMPLATE_ID ? Number(env.BREVO_TEMPLATE_ID) : undefined;
  if (templateId !== undefined && (!Number.isSafeInteger(templateId) || templateId <= 0)) {
    throw new Error('BREVO_TEMPLATE_ID must be a positive integer.');
  }

  await sendBrevoVerificationCode(email, code, {
    apiKey: env.BREVO_API_KEY,
    senderEmail: env.BREVO_SENDER_EMAIL,
    senderName: env.BREVO_SENDER_NAME || 'BuildTogether',
    templateId
  });

  return { delivered: true };
}
