import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { MongoClient, type Db } from 'mongodb';

const { MONGODB_DB, MONGODB_PASSWORD, MONGODB_URI, MONGODB_USERNAME } = env;

const credentials = MONGODB_USERNAME && MONGODB_PASSWORD
  ? `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}`
  : '';

function buildConnectionUri(uri: string | undefined) {
  if (!uri) return undefined;
  const resolved = uri
    .replaceAll('${MONGODB_USERNAME}', encodeURIComponent(MONGODB_USERNAME ?? ''))
    .replaceAll('${MONGODB_PASSWORD}', encodeURIComponent(MONGODB_PASSWORD ?? ''))
    .replace('<username>:<password>', credentials);
  try {
    const parsed = new URL(resolved);
    if (MONGODB_USERNAME) parsed.username = MONGODB_USERNAME;
    if (MONGODB_PASSWORD) parsed.password = MONGODB_PASSWORD;
    return parsed.toString();
  } catch {
    return resolved;
  }
}

const connectionUri = buildConnectionUri(MONGODB_URI);

let clientPromise: Promise<MongoClient> | undefined;
const client = connectionUri ? new MongoClient(connectionUri) : undefined;

declare global {
  // eslint-disable-next-line no-var
  var __buildTogetherMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getDatabase(): Promise<Db> {
  if (!connectionUri || !MONGODB_DB || !client) {
    throw new Error('MongoDB is not configured. Copy .env.example to .env and add your Atlas values.');
  }

  if (!clientPromise) {
    if (dev) {
      clientPromise = globalThis.__buildTogetherMongoClientPromise ?? client.connect();
      globalThis.__buildTogetherMongoClientPromise = clientPromise;
    } else {
      clientPromise = client.connect();
    }
  }

  const connectedClient = await clientPromise;
  return connectedClient.db(MONGODB_DB);
}

export async function getMongoClient(): Promise<MongoClient> {
  await getDatabase();
  return clientPromise!;
}
