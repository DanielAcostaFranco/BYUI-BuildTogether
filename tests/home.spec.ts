import { test, expect, type Page } from '@playwright/test';

async function signInWithLocalCode(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const code = (await page.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
}

test('visitor can search the project directory', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-app-ready="true"]').waitFor();
  await expect(page.getByRole('heading', { name: 'Find your next project.' })).toBeVisible();
  await expect(page.locator('.projects-section .project-card')).toHaveCount(9);
  await page.getByRole('button', { name: 'More projects' }).click();
  await expect(page.locator('.projects-section .project-card')).toHaveCount(18);
  await page.getByLabel('Search projects').fill('rideshare');
  await expect(page.getByRole('heading', { name: 'Campus Rideshare', level: 3 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Food Waste Map' })).toBeHidden();
  await page.getByLabel('Filter public projects by location').selectOption('Remote');
  await expect(page.getByRole('heading', { name: 'Campus Rideshare', level: 3 })).toBeHidden();
});

test('student can request a sign-in link', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(`student-${Date.now()}@byui.edu`);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  await expect(page.getByRole('heading', { name: 'Enter your code.' })).toBeVisible();
  await expect(page.getByLabel('Verification code')).toBeVisible();
});

test('login accepts a non-BYU email address during development', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(`student-${Date.now()}@example.com`);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  await expect(page.getByRole('heading', { name: 'Enter your code.' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Development code:');
});

test('a demo owner can sign in and manage their seeded project', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Try a demo project owner').selectOption('demo-student-001@example.invalid');
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const developmentCode = await page.getByRole('status').textContent();
  const code = developmentCode?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
  await expect(page.locator('.dashboard-page .project-card')).toHaveCount(9);
  await page.getByRole('button', { name: 'More projects' }).click();
  await expect(page.locator('.dashboard-page .project-card')).toHaveCount(18);
  await page.getByLabel('Filter by category').selectOption('Technology');
  await expect(page.locator('.dashboard-page .project-card')).toHaveCount(9);
  await page.goto('/projects/demo-project-001');
  await expect(page.getByRole('heading', { name: 'Study Buddy Finder' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit project' })).toBeVisible();
});

test('a project owner receives and can read a new join-request notification', async ({ page, browser }) => {
  const email = `join-notification-${Date.now()}@example.com`;
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const applicantCode = (await page.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
  expect(applicantCode).toBeTruthy();
  await page.getByLabel('Verification code').fill(applicantCode ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
  await page.goto('/projects/demo-project-001');
  await expect(page.getByText('Add your first and last name before requesting to join.')).toBeVisible();
  await page.getByRole('link', { name: 'Complete your profile' }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('First name').fill('Join');
  await page.getByLabel('Last name').fill('Applicant');
  await page.getByLabel('Major').selectOption('Computer Science');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toContainText('Profile saved');
  await page.goto('/projects/demo-project-001');
  await page.getByLabel('Position to apply for').selectOption('legacy-role-0');
  await page.getByLabel('Why do you want to join?').fill('I want to make student resources easier to find.');
  await page.getByLabel('How could you help?').fill('I can help with research and student interviews.');
  await page.getByLabel('Relevant experience').selectOption('Relevant experience');
  await page.getByLabel('Experience or past work').fill('I interviewed classmates for a course research project.');
  await page.getByLabel('Time you can commit each week').selectOption('3–5 hours');
  await page.getByRole('button', { name: 'Request to join' }).click();
  await expect(page.getByText('Your application is pending.')).toBeVisible();

  const ownerContext = await browser.newContext();
  try {
    const ownerPage = await ownerContext.newPage();
    await ownerPage.goto('/login');
    await ownerPage.locator('[data-app-ready="true"]').waitFor();
    await ownerPage.getByLabel('Try a demo project owner').selectOption('demo-student-001@example.invalid');
    await ownerPage.getByRole('button', { name: 'Send me a code' }).click();
    const ownerCode = (await ownerPage.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
    expect(ownerCode).toBeTruthy();
    await ownerPage.getByLabel('Verification code').fill(ownerCode ?? '');
    await ownerPage.getByRole('button', { name: 'Verify and sign in' }).click();
    await ownerPage.waitForURL('**/home');
    await ownerPage.getByRole('link', { name: /Notifications/ }).click();
    const countBefore = await (await ownerPage.request.get('/api/notifications/unread-count')).json();
    expect(countBefore.unread).toBeGreaterThan(0);
    const newest = ownerPage.locator('.notification').first();
    await expect(newest).toContainText('New request to join');
    await expect(newest).toContainText('Study Buddy Finder');
    await expect(newest).toContainText('Join Applicant');
    await expect(newest.getByText('New', { exact: true })).toBeVisible();
    await newest.getByRole('button', { name: 'Mark read' }).click();
    await expect(newest.getByText('New', { exact: true })).toHaveCount(0);
    const countAfter = await (await ownerPage.request.get('/api/notifications/unread-count')).json();
    expect(countAfter.unread).toBe(countBefore.unread - 1);
    await ownerPage.goto('/projects/demo-project-001');
    const request = ownerPage.locator('#join-requests .application').filter({ hasText: email });
    await expect(request).toBeVisible();
    await expect(request.getByRole('link', { name: email })).toHaveAttribute('href', `mailto:${email}`);
    await request.getByText('Read full request').click();
    await expect(request).toContainText('I interviewed classmates for a course research project.');
    await request.getByRole('button', { name: 'Reject' }).click();
    const rejectDialog = ownerPage.getByRole('dialog');
    await expect(rejectDialog).toContainText('Join Applicant');
    await rejectDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(request).toBeVisible();
    await request.getByRole('button', { name: 'Reject' }).click();
    await rejectDialog.getByRole('button', { name: 'Yes, reject' }).click();
    await expect(ownerPage.locator('#join-requests .application').filter({ hasText: email })).toHaveCount(0);
  } finally {
    await ownerContext.close();
  }
});

test('student can edit and save a profile', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(`profile-${Date.now()}@byui.edu`);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const developmentCode = await page.getByRole('status').textContent();
  const code = developmentCode?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  await page.goto('/profile');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Student');
  await page.getByLabel('Major').selectOption('Computer Science');
  await page.getByLabel('Short bio').fill('I build clear tools that help students find their next opportunity.');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('status')).toContainText('Profile saved');
  await expect(page.getByText('I build clear tools that help students find their next opportunity.')).toBeVisible();
});

test('student can create a project', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(`creator-${Date.now()}@byui.edu`);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const developmentCode = await page.getByRole('status').textContent();
  const code = developmentCode?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
  await page.goto('/projects/new');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Project title').fill('Student Garden Prototype');
  await page.getByLabel('Project description').fill('A student-led prototype for sharing gardening resources and growing food together on campus.');
  await page.getByLabel('Department or academic area').selectOption('Other');
  await page.getByLabel('Total team size').fill('3');
  await page.getByLabel('Position or need 1').fill('Community researcher');
  await page.getByLabel('Position description 1').fill('Interview students, identify needs, and help shape the project direction.');
  await page.getByLabel('People needed for position 1').fill('2');
  await page.getByLabel('Add a skill to position 1').selectOption('Community Building');
  await page.getByRole('button', { name: 'Add skill', exact: true }).click();
  await page.getByLabel('Accept community guidelines').check();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('status')).toContainText('Project created');
});

test('signing out revokes the session and returns to the public landing page', async ({ page }) => {
  await page.goto('/login');
  await page.locator('[data-app-ready="true"]').waitFor();
  await page.getByLabel('Email address').fill(`signout-${Date.now()}@byui.edu`);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const developmentCode = await page.getByRole('status').textContent();
  const code = developmentCode?.match(/\d{6}/)?.[0];
  expect(code).toBeTruthy();
  await page.getByLabel('Verification code').fill(code ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');

  const session = (await page.context().cookies()).find((cookie) => cookie.name === 'buildtogether_session');
  expect(session).toBeTruthy();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('link', { name: 'My applications' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('http://127.0.0.1:4174/');
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);

  await page.context().addCookies([session!]);
  await page.goto('/home');
  await page.waitForURL('**/login');
});

test('a filled position closes recruitment while links and team updates remain public', async ({ page, browser }) => {
  const ownerEmail = `owner-flow-${Date.now()}@example.com`;
  await page.goto('/login');
  await page.getByLabel('Email address').fill(ownerEmail);
  await page.getByRole('button', { name: 'Send me a code' }).click();
  const ownerCode = (await page.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
  expect(ownerCode).toBeTruthy();
  await page.getByLabel('Verification code').fill(ownerCode ?? '');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await page.waitForURL('**/home');
  await page.goto('/projects/new');
  await page.getByRole('button', { name: 'Add project link' }).click();
  await page.getByLabel('Project link label 1').fill('GitHub');
  await page.getByLabel('Project link URL 1').fill('https://github.com/example/student-project');
  await page.getByLabel('Project title').fill('Campus Design Lab');
  await page.getByLabel('Project description').fill('A student design team building and testing a useful campus prototype together.');
  await page.getByLabel('Department or academic area').selectOption('Other');
  await page.getByLabel('Total team size').fill('2');
  await page.getByLabel('Position or need 1').fill('Product designer');
  await page.getByLabel('Position description 1').fill('Design and test a prototype with student feedback.');
  await page.getByLabel('Add a skill to position 1').selectOption('Product Design');
  await page.getByRole('button', { name: 'Add skill', exact: true }).click();
  await page.getByLabel('Accept community guidelines').check();
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.waitForURL('**/projects/project-*');
  const projectUrl = page.url();

  const applicantContext = await browser.newContext();
  const guestContext = await browser.newContext();
  try {
    const applicant = await applicantContext.newPage();
    await applicant.goto('/login');
    await applicant.getByLabel('Email address').fill(`applicant-flow-${Date.now()}@example.com`);
    await applicant.getByRole('button', { name: 'Send me a code' }).click();
    const code = (await applicant.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
    expect(code).toBeTruthy();
    await applicant.getByLabel('Verification code').fill(code ?? '');
    await applicant.getByRole('button', { name: 'Verify and sign in' }).click();
    await applicant.waitForURL('**/home');
    await applicant.goto('/profile');
    await applicant.getByRole('button', { name: 'Edit profile', exact: true }).click();
    await applicant.getByLabel('First name').fill('New');
    await applicant.getByLabel('Last name').fill('Teammate');
    await applicant.getByLabel('Major').selectOption('Computer Science');
    await applicant.getByRole('button', { name: 'Save profile' }).click();
    await expect(applicant.getByRole('status')).toContainText('Profile saved');
    await applicant.goto(projectUrl);
    await applicant.getByLabel('Position to apply for').selectOption({ label: 'Product designer · 1 open' });
    await applicant.getByLabel('Why do you want to join?').fill('I want to learn while building a useful student product.');
    await applicant.getByLabel('How could you help?').fill('I can organize feedback and help test early designs.');
    await applicant.getByLabel('Relevant experience').selectOption('New to this');
    await applicant.getByLabel('Time you can commit each week').selectOption('3–5 hours');
    await applicant.getByRole('button', { name: 'Request to join' }).click();
    await expect(applicant.getByText('Your application is pending.')).toBeVisible();

    await page.reload();
    await expect(page.locator('.application').getByText('Product designer')).toBeVisible();
    await page.getByRole('button', { name: 'Accept' }).click();
    const acceptDialog = page.getByRole('dialog');
    await expect(acceptDialog).toContainText('New Teammate');
    await acceptDialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#join-requests .application')).toHaveCount(1);
    await page.getByRole('button', { name: 'Accept' }).click();
    await acceptDialog.getByRole('button', { name: 'Yes, accept' }).click();
    await expect(page.locator('.status')).toContainText('In progress');
    await expect(page.getByText('Team complete · following progress')).toBeVisible();

    await applicant.reload();
    await expect(applicant.getByText('You are on this team.')).toBeVisible();
    await applicant.getByLabel('Share a progress update').fill('We built the first prototype and are preparing student interviews.');
    await applicant.getByRole('button', { name: 'Post update' }).click();
    await expect(applicant.getByText('We built the first prototype and are preparing student interviews.')).toBeVisible();

    const guest = await guestContext.newPage();
    await guest.goto(projectUrl);
    await expect(guest.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/example/student-project');
    await expect(guest.getByText('We built the first prototype and are preparing student interviews.')).toBeVisible();
    await expect(guest.getByRole('button', { name: 'Request to join' })).toHaveCount(0);
  } finally {
    await applicantContext.close();
    await guestContext.close();
  }
});

test('owner adds an existing student, invites a new one, and removes a member', async ({ page, browser }) => {
  const stamp = Date.now();
  const ownerEmail = `team-owner-${stamp}@byui.edu`;
  const existingEmail = `team-existing-${stamp}@byui.edu`;
  const invitedEmail = `team-invited-${stamp}@byui.edu`;
  const existingContext = await browser.newContext();
  const invitedContext = await browser.newContext();
  try {
    const existingPage = await existingContext.newPage();
    await signInWithLocalCode(existingPage, existingEmail);
    await signInWithLocalCode(page, ownerEmail);
    await page.goto('/projects/new');
    await page.getByLabel('Project title').fill('Team Invitation Test Project');
    await page.getByLabel('Project description').fill('A student team building and testing a useful campus project together.');
    await page.getByLabel('Department or academic area').selectOption('Other');
    await page.getByLabel('Total team size').fill('3');
    await page.getByLabel('Position or need 1').fill('Product designer');
    await page.getByLabel('Position description 1').fill('Design and test a prototype with student feedback.');
    await page.getByLabel('People needed for position 1').fill('2');
    await page.getByLabel('Add a skill to position 1').selectOption('Product Design');
    await page.getByRole('button', { name: 'Add skill', exact: true }).click();
    await page.getByLabel('Accept community guidelines').check();
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.waitForURL('**/projects/project-*');
    const projectUrl = page.url();
    await page.goto(`${projectUrl}/team`);

    await page.getByLabel('BYU-Idaho email').fill(existingEmail);
    await page.getByLabel('Position').selectOption({ label: 'Product designer · 2 open' });
    await page.getByRole('button', { name: 'Add or invite student' }).click();
    await expect(page.getByRole('status')).toContainText('Team member added');
    await expect(page.locator('.team-count')).toContainText('2 of 3 members');

    await page.getByLabel('BYU-Idaho email').fill(invitedEmail);
    await page.getByLabel('Position').selectOption({ label: 'Product designer · 1 open' });
    await page.getByRole('button', { name: 'Add or invite student' }).click();
    await expect(page.getByRole('status')).toContainText('Invitation sent');
    await expect(page.locator('.invitation-list')).toContainText(invitedEmail);
    const invitationUrl = await page.getByRole('link', { name: 'Open invitation' }).getAttribute('href');
    expect(invitationUrl).toBeTruthy();

    const invitedPage = await invitedContext.newPage();
    await invitedPage.goto(invitationUrl ?? '');
    await invitedPage.waitForURL('**/login?next=*');
    await invitedPage.getByLabel('Email address').fill(invitedEmail);
    await invitedPage.getByRole('button', { name: 'Send me a code' }).click();
    const code = (await invitedPage.getByRole('status').textContent())?.match(/\d{6}/)?.[0];
    expect(code).toBeTruthy();
    await invitedPage.getByLabel('Verification code').fill(code ?? '');
    await invitedPage.getByRole('button', { name: 'Verify and sign in' }).click();
    await invitedPage.waitForURL('**/invitations/*');
    await invitedPage.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(invitedPage.getByText('You are on the team.')).toBeVisible();

    await page.reload();
    await expect(page.locator('.team-count')).toContainText('3 of 3 members');
    const member = page.locator('.member-card').filter({ hasText: existingEmail });
    page.once('dialog', (dialog) => dialog.accept());
    await member.getByRole('button', { name: 'Remove from team' }).click();
    await expect(page.getByRole('status')).toContainText('Team member removed');
    await expect(page.locator('.team-count')).toContainText('2 of 3 members');
  } finally {
    await existingContext.close();
    await invitedContext.close();
  }
});
