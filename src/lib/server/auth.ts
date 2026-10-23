import { randomBytes, randomInt, scrypt as nodeScrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { Resend } from 'resend';
import type { Db } from 'mongodb';
import { isDemoAddress } from '$lib/auth-policy';

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

  if (!env.RESEND_API_KEY) {
    if (dev) {
      console.info(`[BuildTogether auth] Development code for ${email}: ${code}`);
      return { delivered: false, developmentCode: code };
    }

    throw new Error('RESEND_API_KEY is missing. Configure an email provider before production.');
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.AUTH_EMAIL_FROM || 'BuildTogether <onboarding@resend.dev>',
    to: [email],
    subject: 'Your BuildTogether sign-in code',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5"><h2>BuildTogether sign-in</h2><p>Use this code to continue:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`
  });

  if (error) {
    throw new Error(`Email provider error: ${error.message}`);
  }

  return { delivered: true };
}
