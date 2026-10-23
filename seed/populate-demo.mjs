import { MongoClient } from 'mongodb';
import { loadEnv } from 'vite';

// Fictional content only. The .invalid domain cannot receive a sign-in code.
const projectIdeas = [
  ['Study Buddy Finder', 'Help classmates form study groups around courses, schedules, and shared goals.', 'Technology', 'Computer Science', 'Web development', 'Education'],
  ['Campus Accessibility Map', 'Document accessible paths, entrances, and classroom details with student feedback.', 'Design', 'Design & Construction Management', 'UX design', 'Accessibility'],
  ['Rexburg Food Pantry Network', 'Connect local pantry resources with students through a clear, up-to-date directory.', 'Community', 'Social Work', 'Community outreach', 'Food security'],
  ['Student Startup Toolkit', 'Create practical templates for students testing their first small business ideas.', 'Business', 'Business Management', 'Entrepreneurship', 'Startups'],
  ['Winter Wellness Check-In', 'Research healthy winter routines and design a peer-friendly wellness resource.', 'Research', 'Psychology', 'Research', 'Wellness'],
  ['Open Lab Hours', 'Make it easier to discover available campus study spaces and collaborative work areas.', 'Technology', 'Information Systems', 'Web development', 'Campus life'],
  ['Local Makers Directory', 'Showcase student artists and makers in a searchable community directory.', 'Design', 'Art', 'Visual design', 'Creative work'],
  ['First-Generation Stories', 'Collect student stories and resources for first-generation college students.', 'Community', 'Communication', 'Storytelling', 'Belonging'],
  ['Small Business Cash Flow Coach', 'Prototype simple budgeting lessons for student-run businesses.', 'Business', 'Accounting', 'Financial modeling', 'Entrepreneurship'],
  ['Campus Air Quality Journal', 'Study seasonal air-quality patterns and explain results in approachable visuals.', 'Research', 'Environmental Science', 'Data analysis', 'Environment'],
  ['Language Exchange Circles', 'Match learners for casual language practice and cultural exchange.', 'Community', 'Languages & International Studies', 'Community outreach', 'Languages'],
  ['Volunteer Hours Hub', 'Help student groups discover and coordinate local service opportunities.', 'Technology', 'Software Engineering', 'Web development', 'Service'],
  ['Sustainable Fashion Swap', 'Organize a student clothing exchange with thoughtful, low-waste guidelines.', 'Community', 'Family & Consumer Sciences', 'Event planning', 'Sustainability'],
  ['Inclusive Poster System', 'Create reusable event-poster templates that work for different campus audiences.', 'Design', 'Graphic Design', 'Visual design', 'Accessibility'],
  ['Farm-to-Table Recipe Cards', 'Develop affordable recipes using regional ingredients and clear nutrition information.', 'Research', 'Nutrition & Dietetics', 'Nutrition research', 'Food'],
  ['Music Collaboration Board', 'Help student musicians find collaborators for performances and recordings.', 'Technology', 'Music', 'Product design', 'Music'],
  ['Rexburg Transit Survey', 'Research how students travel around Rexburg and identify unmet transportation needs.', 'Research', 'Geography', 'Survey design', 'Transportation'],
  ['Student Podcast Studio', 'Produce short interviews about projects, learning, and life at BYU-Idaho.', 'Community', 'Communication', 'Audio editing', 'Storytelling'],
  ['Peer Portfolio Reviews', 'Build a welcoming way for students to exchange constructive portfolio feedback.', 'Design', 'Web Design & Development', 'UX design', 'Career growth'],
  ['Local Nonprofit Match', 'Connect nonprofit needs with student teams looking for meaningful projects.', 'Business', 'Public Administration', 'Partnerships', 'Service'],
  ['Physics Demo Library', 'Create simple interactive demonstrations that make difficult physics ideas easier to see.', 'Technology', 'Physics', 'Interactive design', 'Education'],
  ['Early Childhood Activity Bank', 'Gather affordable, age-appropriate learning activities for local families.', 'Research', 'Child Development', 'Education research', 'Families'],
  ['Campus Garden Journal', 'Track planting experiments and share practical lessons from growing in a cold climate.', 'Community', 'Horticulture', 'Field research', 'Sustainability'],
  ['Student Film Collective', 'Bring writers, camera operators, and editors together for short original films.', 'Design', 'Theatre & Dance', 'Video production', 'Film'],
  ['Cyber Safety for Student Clubs', 'Make short, practical security guides for student organizations.', 'Technology', 'Cybersecurity', 'Security research', 'Digital safety'],
  ['Neighborhood History Walks', 'Research Rexburg history and turn it into respectful, self-guided walking routes.', 'Research', 'History', 'Historical research', 'Local history'],
  ['Adaptive Recreation Ideas', 'Explore inclusive recreation activities and prototype accessible event plans.', 'Community', 'Recreation Management', 'Event planning', 'Accessibility'],
  ['Student Photography Archive', 'Curate a student-made visual record of everyday campus life.', 'Design', 'Photography', 'Photography', 'Campus life'],
  ['Open Data for Rexburg', 'Turn public data into small, understandable charts for student and community questions.', 'Technology', 'Data Science', 'Data visualization', 'Local community'],
  ['Hospitality Service Lab', 'Test thoughtful ways to improve visitor experiences at student-led events.', 'Business', 'Hospitality & Tourism Management', 'Service design', 'Hospitality'],
  ['Engineering Repair Café', 'Plan supervised workshops for troubleshooting and repairing everyday items.', 'Community', 'Mechanical Engineering', 'Prototyping', 'Sustainability'],
  ['Campus Pollinator Study', 'Observe local pollinators and share findings through a student-friendly field guide.', 'Research', 'Biology', 'Field research', 'Environment'],
  ['Teacher Resource Exchange', 'Help future teachers share original classroom activities and feedback.', 'Technology', 'Elementary Education', 'Web development', 'Teaching'],
  ['Mental Health Resource Cards', 'Design clear signposts to existing support resources without offering clinical advice.', 'Design', 'Health Psychology', 'Information design', 'Wellness'],
  ['Student Business Pitch Night', 'Organize a low-pressure evening for students to present and refine early ideas.', 'Business', 'Marketing', 'Event planning', 'Entrepreneurship'],
  ['Rexburg Snow Safety Guide', 'Collect practical winter-safety tips and route information for new students.', 'Community', 'Emergency Management', 'Research', 'Winter'],
  ['Chemistry Visual Notes', 'Build original visual study aids for introductory chemistry concepts.', 'Design', 'Chemistry', 'Illustration', 'Education'],
  ['Career Story Interviews', 'Interview alumni about career paths and summarize useful, honest lessons.', 'Research', 'Sociology', 'Interviews', 'Career growth'],
  ['Agriculture Sensor Prototype', 'Explore a low-cost sensor concept for small greenhouse monitoring.', 'Technology', 'Agricultural Engineering', 'Prototyping', 'Agriculture'],
  ['Community Arts Weekend', 'Plan a collaborative showcase where students share art with local families.', 'Community', 'Art Education', 'Event planning', 'Arts']
];

const firstNames = ['Avery', 'Jordan', 'Riley', 'Morgan', 'Casey', 'Taylor', 'Parker', 'Quinn', 'Skyler', 'Jamie'];
const lastNames = ['Brooks', 'Rivera', 'Chen', 'Patel', 'Kim', 'Thompson'];
const demoOwnerNames = [
  ['John', 'Doe'],
  ['Sofia', 'Martinez'],
  ['Noah', 'Williams'],
  ['Maya', 'Patel'],
  ['Liam', 'Chen'],
  ['Emma', 'Johnson'],
  ['Olivia', 'Garcia'],
  ['Ethan', 'Brooks']
];
const majors = ['Computer Science', 'Graphic Design', 'Biology', 'Business Management', 'Communication', 'Psychology', 'Accounting', 'Mechanical Engineering', 'Social Work', 'Data Science', 'Music', 'Elementary Education'];
const skillSets = [
  ['Web development', 'Research', 'Teamwork'],
  ['UX design', 'Visual design', 'Interviews'],
  ['Data analysis', 'Writing', 'Community outreach'],
  ['Marketing', 'Event planning', 'Storytelling'],
  ['Prototyping', 'Photography', 'Project management']
];
const demoCreatorIds = Array.from({ length: 8 }, (_, index) => `demo-student-${String(index + 1).padStart(3, '0')}`);

function demoUsers() {
  return firstNames.flatMap((firstName, firstIndex) => lastNames.map((lastName, lastIndex) => {
    const number = firstIndex * lastNames.length + lastIndex + 1;
    const [displayFirstName, displayLastName] = demoOwnerNames[number - 1] ?? [firstName, lastName];
    return {
      id: `demo-student-${String(number).padStart(3, '0')}`,
      firstName: displayFirstName, lastName: displayLastName,
      email: `demo-student-${String(number).padStart(3, '0')}@example.invalid`,
      role: 'student',
      major: majors[(number - 1) % majors.length],
      graduationYear: 2026 + (number % 6),
      bio: `Fictional demo student interested in ${majors[(number - 1) % majors.length].toLowerCase()} and collaborative projects.`,
      skills: skillSets[(number - 1) % skillSets.length],
      interests: [projectIdeas[(number - 1) % projectIdeas.length][5]],
      links: [], previousProjects: [], avatarUrl: null,
      isDemo: true,
      createdAt: new Date('2026-10-21T00:00:00.000Z')
    };
  }));
}

function demoProjects() {
  return projectIdeas.map(([title, summary, category, department, skill, interest], index) => {
    const number = index + 1;
    return {
      id: `demo-project-${String(number).padStart(3, '0')}`,
      title, summary, category, department, creatorId: demoCreatorIds[index % demoCreatorIds.length],
      status: index % 7 === 0 ? 'Idea' : 'Recruiting',
      skills: [skill, 'Collaboration'], interests: [interest],
      roles: [
        { title: `${skill} contributor`, description: `Help shape and deliver the ${title.toLowerCase()} project using ${skill.toLowerCase()}.`, skills: [skill], peopleNeeded: 1 },
        { title: 'Research and outreach', description: 'Talk with potential users, collect feedback, and help the team prioritize next steps.', skills: ['Research', 'Communication'], peopleNeeded: 2 }
      ],
      hoursPerWeek: ['2–4 hrs / week', '3–5 hrs / week', '4–6 hrs / week'][index % 3],
      location: ['Hybrid', 'Remote', 'In person'][index % 3],
      openRoles: 3, teamSize: 4, featured: false, isDemo: true,
      createdAt: new Date('2026-10-21T00:00:00.000Z'),
      updatedAt: new Date('2026-10-21T00:00:00.000Z')
    };
  });
}

function connectionSettings() {
  const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
  const { MONGODB_URI, MONGODB_USERNAME, MONGODB_PASSWORD, MONGODB_DB } = env;
  if (!MONGODB_URI || !MONGODB_DB) throw new Error('Set MONGODB_URI and MONGODB_DB in .env before running this script.');
  const credentials = MONGODB_USERNAME && MONGODB_PASSWORD
    ? `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}` : '';
  return {
    uri: MONGODB_URI.replaceAll('${MONGODB_USERNAME}', encodeURIComponent(MONGODB_USERNAME ?? ''))
      .replaceAll('${MONGODB_PASSWORD}', encodeURIComponent(MONGODB_PASSWORD ?? ''))
      .replace('<username>:<password>', credentials),
    databaseName: MONGODB_DB,
    adminEmail: env.MONGODB_ADMIN_EMAIL?.trim().toLowerCase()
  };
}

async function findCreator(database, adminEmail) {
  const users = database.collection('users');
  if (adminEmail) {
    const admin = await users.findOne({ email: adminEmail, role: 'admin' }, { projection: { id: 1, firstName: 1, lastName: 1 } });
    if (admin) return admin;
  }
  const seeded = await users.findOne({ id: 'daniel-admin', role: 'admin' }, { projection: { id: 1, firstName: 1, lastName: 1 } });
  if (seeded) return seeded;
  const admins = await users.find({ role: 'admin', firstName: { $regex: /^daniel$/i } }, { projection: { id: 1, firstName: 1, lastName: 1 } }).toArray();
  if (admins.length === 1) return admins[0];
  throw new Error('Could not identify one Daniel admin account. Set MONGODB_ADMIN_EMAIL to his registered BYUI email.');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--dry-run'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) {
    throw new Error('Usage: npm run seed:demo -- [--dry-run | --apply]');
  }
  const apply = args.includes('--apply');
  const { uri, databaseName, adminEmail } = connectionSettings();
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const database = client.db(databaseName);
    const creator = await findCreator(database, adminEmail);
    const students = demoUsers();
    const projects = demoProjects();
    const memberships = projects.map((project) => ({
      id: `demo-membership-${project.id}`,
      projectId: project.id, userId: project.creatorId, role: 'Creator',
      joinedAt: new Date('2026-10-21T00:00:00.000Z'), isDemo: true
    }));
    for (const [collectionName, documents] of [['users', students], ['projects', projects], ['projectMembers', memberships]]) {
      const collection = database.collection(collectionName);
      const ids = documents.map(({ id }) => id);
      const existing = await collection.countDocuments({ id: { $in: ids } });
      console.log(`${collectionName}: ${documents.length} demo records planned; ${existing} already present.`);
      if (apply) {
        const result = await collection.bulkWrite(documents.map((document) => ({
          updateOne: { filter: { id: document.id }, update: { $setOnInsert: document }, upsert: true }
        })), { ordered: false });
        console.log(`  Inserted ${result.upsertedCount}; existing records left unchanged.`);
      }
    }
    const ownerProfiles = await database.collection('users').find(
      { id: { $in: demoCreatorIds }, isDemo: true },
      { projection: { id: 1, firstName: 1, lastName: 1 } }
    ).toArray();
    const ownerProfileById = new Map(ownerProfiles.map((profile) => [profile.id, profile]));
    const oldNames = demoCreatorIds.map((id, index) => {
      const oldFirstName = firstNames[Math.floor(index / lastNames.length)];
      const oldLastName = lastNames[index % lastNames.length];
      const profile = ownerProfileById.get(id);
      return profile?.firstName === oldFirstName && profile?.lastName === oldLastName
        ? { id, oldFirstName, oldLastName, newFirstName: demoOwnerNames[index][0], newLastName: demoOwnerNames[index][1] }
        : null;
    }).filter(Boolean);
    console.log(`Placeholder owner profiles to rename: ${oldNames.length}.`);
    if (apply) {
      for (const name of oldNames) {
        await database.collection('users').updateOne(
          { id: name.id, isDemo: true, firstName: name.oldFirstName, lastName: name.oldLastName },
          { $set: { firstName: name.newFirstName, lastName: name.newLastName } }
        );
      }
    }
    const oldProjects = await database.collection('projects').countDocuments({ id: { $in: projects.map(({ id }) => id) }, isDemo: true, creatorId: creator.id });
    const oldMemberships = await database.collection('projectMembers').countDocuments({ id: { $in: memberships.map(({ id }) => id) }, isDemo: true, userId: creator.id });
    console.log(`Legacy Daniel-owned demo projects to reassign: ${oldProjects}; creator memberships: ${oldMemberships}.`);
    if (apply) {
      let changedProjects = 0;
      let changedMemberships = 0;
      for (const [index, project] of projects.entries()) {
        changedProjects += (await database.collection('projects').updateOne(
          { id: project.id, isDemo: true, creatorId: creator.id },
          { $set: { creatorId: project.creatorId } }
        )).modifiedCount;
        changedMemberships += (await database.collection('projectMembers').updateOne(
          { id: memberships[index].id, isDemo: true, userId: creator.id },
          { $set: { userId: project.creatorId } }
        )).modifiedCount;
      }
      console.log(`Reassigned ${changedProjects} projects and ${changedMemberships} creator memberships.`);
    }
    console.log(`Demo project owners: ${demoCreatorIds.length} fictional student accounts. Mode: ${apply ? 'applied' : 'dry run'}.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`Demo seed failed: ${error.message}`);
  process.exitCode = 1;
});
