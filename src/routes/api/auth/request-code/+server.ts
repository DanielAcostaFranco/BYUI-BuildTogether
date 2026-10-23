import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { canUseSignInEmail } from '$lib/auth-policy';
import { loginSchema } from '$lib/schemas';
import { getDatabase } from '$lib/server/mongodb';
import { createVerificationCode, hashSecret, normalizeEmail, sendVerificationCode, verificationExpiresAt } from '$lib/server/auth';

export async function POST({ request }) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return json({ ok: false, message: result.error.issues[0]?.message ?? 'Enter a valid email address.' }, { status: 400 });
  }

  const email = normalizeEmail(result.data.email);
  const database = await getDatabase();
  const demoUser = await database.collection('users').findOne({ email, isDemo: true }, { projection: { _id: 1 } });
  if (!canUseSignInEmail(email, dev, Boolean(demoUser))) {
    return json({ ok: false, message: 'Demo accounts are available only during local development.' }, { status: 400 });
  }
  const codes = database.collection('authCodes');
  await codes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  const recentCode = await codes.findOne({
    email,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
  });

  if (recentCode) {
    return json({ ok: false, message: 'Please wait a minute before requesting another code.' }, { status: 429 });
  }

  const code = createVerificationCode();
  const { salt, hash } = await hashSecret(code);
  await codes.deleteMany({ email });
  await codes.insertOne({
    email,
    hash,
    salt,
    attempts: 0,
    createdAt: new Date(),
    expiresAt: verificationExpiresAt()
  });

  try {
    const delivery = await sendVerificationCode(email, code, Boolean(demoUser));
    return json({
      ok: true,
      message: 'Your sign-in code is on its way.',
      developmentCode: delivery.developmentCode
    });
  } catch (error) {
    await codes.deleteMany({ email });
    console.error('Could not send sign-in code:', error);
    return json({ ok: false, message: 'We could not send your code. Check the email provider configuration.' }, { status: 502 });
  }
}
