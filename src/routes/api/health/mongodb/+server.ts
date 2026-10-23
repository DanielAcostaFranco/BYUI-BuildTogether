import { json } from '@sveltejs/kit';
import { getDatabase } from '$lib/server/mongodb';

export async function GET() {
  try {
    const database = await getDatabase();
    await database.command({ ping: 1 });

    return json({
      ok: true,
      database: database.databaseName,
      message: 'MongoDB connection is working.'
    });
  } catch (error) {
    console.error('MongoDB health check failed:', error);

    return json(
      {
        ok: false,
        message: 'MongoDB connection failed. Check your .env values and Atlas network access.'
      },
      { status: 503 }
    );
  }
}
