import { describe, expect, it } from 'vitest';
import { canUseSignInEmail } from './auth-policy';
import { loginSchema, verifyCodeSchema } from './schemas';

describe('email sign-in policy', () => {
  it('accepts valid non-BYUI addresses for the temporary development flow', () => {
    expect(loginSchema.safeParse({ email: 'student@gmail.com' }).success).toBe(true);
    expect(verifyCodeSchema.safeParse({ email: 'student@gmail.com', code: '123456' }).success).toBe(true);
  });

  it('rejects malformed addresses and invalid codes', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ email: 'student@gmail.com', code: '123' }).success).toBe(false);
  });

  it('allows a seeded demo address only for an existing demo user in development', () => {
    expect(canUseSignInEmail('demo-student-001@example.invalid', true, true)).toBe(true);
    expect(canUseSignInEmail('demo-student-001@example.invalid', true, false)).toBe(false);
    expect(canUseSignInEmail('demo-student-001@example.invalid', false, true)).toBe(false);
  });

  it('keeps ordinary verified email addresses available', () => {
    expect(canUseSignInEmail('student@gmail.com', true, false)).toBe(true);
    expect(canUseSignInEmail('student@gmail.com', false, false)).toBe(true);
  });
});
