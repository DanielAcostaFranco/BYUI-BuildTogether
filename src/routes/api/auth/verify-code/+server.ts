import { randomBytes, randomUUID } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { canUseSignInEmail } from '$lib/auth-policy';
import { verifyCodeSchema } from '$lib/schemas';
import { env } from '$env/dynamic/private';
import { getDatabase } from '$lib/server/mongodb';
import { hashSessionToken, hashSecret, normalizeEmail, sessionExpiresAt, sessionMaxAge, verifySecret } from '$lib/server/auth';

export async function POST({ request, cookies }) {
  const body = await request.json().catch(() => null);
  const result = verifyCodeSchema.safeParse(body);

  if (!result.success) {
    return json({ ok: false, message: result.error.issues[0]?.message ?? 'Enter the six-digit code.' }, { status: 400 });
  }

  const email = normalizeEmail(result.data.email);
  const database = await getDatabase();
  const users = database.collection('users');
  const existingUser = await users.findOne({ email });
  if (!canUseSignInEmail(email, dev, existingUser?.isDemo === true)) {
    return json({ ok: false, message: 'Demo accounts are available only during local development.' }, { status: 400 });
  }
  const codes = database.collection('authCodes');
  const storedCode = await codes.findOne({ email }, { sort: { createdAt: -1 } });

  if (!storedCode || storedCode.expiresAt < new Date()) {
    return json({ ok: false, message: 'That code has expired. Request a new one.' }, { status: 400 });
  }

  if ((storedCode.attempts ?? 0) >= 5) {
    await codes.deleteOne({ _id: storedCode._id });
    return json({ ok: false, message: 'Too many attempts. Request a new code.' }, { status: 400 });
  }

  const valid = await verifySecret(result.data.code, storedCode.salt, storedCode.hash);
  if (!valid) {
    await codes.updateOne({ _id: storedCode._id }, { $inc: { attempts: 1 } });
    return json({ ok: false, message: 'That code is not correct.' }, { status: 400 });
  }

  await codes.deleteOne({ _id: storedCode._id });
  const userId = existingUser?.id ?? randomUUID();

  if (!existingUser) {
    await users.insertOne({
      id: userId,
      firstName: '',
      lastName: '',
      email,
      role: env.MONGODB_ADMIN_EMAIL && normalizeEmail(env.MONGODB_ADMIN_EMAIL) === email ? 'admin' : 'student',
      major: '',
      graduationYear: null,
      bio: '',
      skills: [],
      links: [],
      createdAt: new Date()
    });
  }

  const sessionToken = randomBytes(32).toString('base64url');
  await database.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await database.collection('sessions').insertOne({
    tokenHash: hashSessionToken(sessionToken),
    userId,
    email,
    createdAt: new Date(),
    expiresAt: sessionExpiresAt()
  });

  cookies.set('buildtogether_session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.env.DEV,
    path: '/',
    maxAge: sessionMaxAge()
  });

  return json({ ok: true, message: 'You are signed in.', userId });
}
