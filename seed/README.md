# BuildTogether seed data

Before importing `users.json`, replace `YOUR_BYUI_EMAIL@byui.edu` with your real BYU-Idaho email. Do not add passwords to this file.

In MongoDB Atlas:

1. Open the `buildtogether` database in **Browse Collections**.
2. Create or select the `users` collection and import `users.json`.
3. Create or select the `projects` collection and import `projects.json`.
4. Create or select the `supportMessages` collection and import `supportMessages.json`.

These files use regular JSON arrays, which Atlas can import through **Add Data → Import JSON or CSV**.

## Larger, repeatable demo dataset

From the project root, run `npm run seed:demo` to preview the changes, then `npm run seed:demo -- --apply` to insert 60 fictional students, 40 project ideas, and 40 creator memberships into your configured Atlas database. The 40 demo projects are divided among the first eight fictional students. The script reads your existing `.env` and connects to `MONGODB_DB`; it never writes passwords or changes real records. It also reassigns older demo projects that were initially attributed to Daniel. Later runs do not duplicate records or overwrite manual edits to demo projects.

Demo records have `isDemo: true` and IDs beginning with `demo-`. Fictional users use `@example.invalid` addresses. The first eight creator profiles include John Doe, Sofia Martinez, and six other distinct names. In local development, these accounts appear on the sign-in page; select one to receive an on-screen development code and test owner/applicant actions. These addresses cannot receive real emails, and demo sign-in is disabled in production. Replace or remove demo content before launching a real student community.
