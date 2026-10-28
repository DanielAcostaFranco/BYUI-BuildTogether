import { describe, expect, it } from 'vitest';
import { applicationSchema, projectSchema, projectUpdateSchema } from './schemas';

const project = {
  title: 'Campus Design Lab', summary: 'Students build and test a useful campus prototype.',
  category: 'Design', department: 'Design', skills: ['Figma'], interests: [],
  roles: [{ id: 'design', title: 'Designer', description: 'Design a prototype.', skills: ['Figma'], peopleNeeded: 1 }],
  hoursPerWeek: '2–4 hrs / week', location: 'Hybrid', openRoles: 1, teamSize: 2, termsAccepted: true
};

describe('project collaboration inputs', () => {
  it('accepts an HTTPS project link and an in-progress status', () => {
    expect(projectSchema.safeParse({ ...project, status: 'In progress', links: [{ label: 'GitHub', url: 'https://github.com/example/repo' }] }).success).toBe(true);
  });

  it('rejects a non-web project link', () => {
    expect(projectSchema.safeParse({ ...project, links: [{ label: 'Unsafe', url: 'javascript:alert(1)' }] }).success).toBe(false);
  });

  it('requires a position when applying', () => {
    const request = { roleId: 'design', message: 'I want to help design a useful campus tool.', contribution: 'I can interview students and sketch prototypes.', experienceLevel: 'New to this', experienceDetails: '', availabilityHours: '3–5 hours' };
    expect(applicationSchema.safeParse({ ...request, roleId: '' }).success).toBe(false);
    expect(applicationSchema.safeParse(request).success).toBe(true);
    expect(applicationSchema.safeParse({ ...request, experienceLevel: 'Relevant experience' }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...request, experienceLevel: 'Relevant experience', experienceDetails: 'I designed a class project with user interviews.' }).success).toBe(true);
    expect(applicationSchema.safeParse({ ...request, workSampleUrl: 'javascript:alert(1)' }).success).toBe(false);
  });

  it('rejects a blank progress update', () => {
    expect(projectUpdateSchema.safeParse({ text: '  ' }).success).toBe(false);
  });
});
