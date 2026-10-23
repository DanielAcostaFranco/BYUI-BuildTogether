import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { MongoClient, type Db } from 'mongodb';

const { MONGODB_DB, MONGODB_PASSWORD, MONGODB_URI, MONGODB_USERNAME } = env;

const credentials = MONGODB_USERNAME && MONGODB_PASSWORD
  ? `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}`
  : '';

const connectionUri = MONGODB_URI
  ?.replaceAll('${MONGODB_USERNAME}', encodeURIComponent(MONGODB_USERNAME ?? ''))
  .replaceAll('${MONGODB_PASSWORD}', encodeURIComponent(MONGODB_PASSWORD ?? ''))
  .replace('<username>:<password>', credentials);

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
