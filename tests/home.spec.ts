import { test, expect } from '@playwright/test';

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
  await page.getByLabel('Application message').fill('I can help with the research and student interviews.');
  await page.getByRole('button', { name: 'Request to join' }).click();
  await expect(page.getByRole('status')).toContainText('Application sent');

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
    await expect(newest.getByText('New', { exact: true })).toBeVisible();
    await newest.getByRole('button', { name: 'Mark read' }).click();
    await expect(newest.getByText('New', { exact: true })).toHaveCount(0);
    const countAfter = await (await ownerPage.request.get('/api/notifications/unread-count')).json();
    expect(countAfter.unread).toBe(countBefore.unread - 1);
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
