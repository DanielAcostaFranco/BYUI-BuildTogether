import { MongoClient } from 'mongodb';
import { loadEnv } from 'vite';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const credentials = env.MONGODB_USERNAME && env.MONGODB_PASSWORD
  ? `${encodeURIComponent(env.MONGODB_USERNAME)}:${encodeURIComponent(env.MONGODB_PASSWORD)}` : '';
const uri = env.MONGODB_URI
  ?.replaceAll('${MONGODB_USERNAME}', encodeURIComponent(env.MONGODB_USERNAME ?? ''))
  .replaceAll('${MONGODB_PASSWORD}', encodeURIComponent(env.MONGODB_PASSWORD ?? ''))
  .replace('<username>:<password>', credentials);

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some((argument) => argument !== '--apply')) throw new Error('Usage: npm run backfill:notifications -- [--apply]');
  if (!uri || !env.MONGODB_DB) throw new Error('MongoDB is not configured.');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const database = client.db(env.MONGODB_DB);
    const applications = await database.collection('projectApplications').find({ status: 'pending' }).toArray();
    const projectIds = [...new Set(applications.map((application) => application.projectId))];
    const applicantIds = [...new Set(applications.map((application) => application.applicantId))];
    const [projects, users] = await Promise.all([
      database.collection('projects').find({ id: { $in: projectIds } }, { projection: { id: 1, title: 1, creatorId: 1 } }).toArray(),
      database.collection('users').find({ id: { $in: applicantIds } }, { projection: { id: 1, firstName: 1, lastName: 1 } }).toArray()
    ]);
    const projectById = new Map(projects.map((project) => [project.id, project]));
    const userById = new Map(users.map((user) => [user.id, user]));
    let missing = 0;
    for (const application of applications) {
      const project = projectById.get(application.projectId);
      if (!project?.creatorId) continue;
      const applicant = userById.get(application.applicantId);
      const id = `notification-${application.id}`;
      if (await database.collection('notifications').countDocuments({ id })) continue;
      missing++;
      if (apply) {
        await database.collection('notifications').updateOne({ id }, { $setOnInsert: {
          id, userId: project.creatorId, type: 'application_received', title: 'New request to join',
          message: `${[applicant?.firstName, applicant?.lastName].filter(Boolean).join(' ') || 'A student'} wants to join ${project.title}.`,
          projectId: project.id, applicationId: application.id, read: false,
          createdAt: application.createdAt ?? new Date()
        } }, { upsert: true });
      }
    }
    console.log(`${applications.length} pending applications checked; ${missing} owner notifications ${apply ? 'inserted' : 'missing (dry run)'}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(`Notification backfill failed: ${error.message}`); process.exitCode = 1; });
