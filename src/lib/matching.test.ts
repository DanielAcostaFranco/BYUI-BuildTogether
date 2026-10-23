import { describe, expect, it } from 'vitest';
import { rankProjects, scoreProjectMatch } from './matching';
import type { Project } from './types';

const project: Project = {
  id: 'test-project',
  title: 'Campus Research Tool',
  summary: 'A student research project.',
  category: 'Technology',
  status: 'Recruiting',
  department: 'Computer Science',
  creator: 'Daniel',
  initials: 'D',
  skills: ['Research', 'Figma'],
  interests: ['Education', 'Accessibility'],
  hoursPerWeek: '2–4 hrs / week',
  location: 'Remote',
  openRoles: 2
};

describe('project matching', () => {
  it('rewards matching skills and explains why the project fits', () => {
    const result = scoreProjectMatch(project, { major: 'Computer Science', skills: ['Figma', 'Research'] });

    expect(result.score).toBe(65);
    expect(result.reasons).toEqual(['2 matching skills', 'Your major fits this project', 'Currently recruiting']);
  });

  it('ranks the strongest project first', () => {
    const weakerProject = { ...project, id: 'weaker', title: 'Other project', skills: ['Writing'] };

    const results = rankProjects([weakerProject, project], { skills: ['Figma'] });

    expect(results.map((match) => match.project.id)).toEqual(['test-project', 'weaker']);
  });

  it('returns a useful fallback reason when there is no match', () => {
    const result = scoreProjectMatch(project, { major: 'History', skills: ['Writing'] });

    expect(result.score).toBe(10);
    expect(result.reasons).toEqual(['Currently recruiting']);
  });

  it('adds points and an explanation for shared interests', () => {
    const result = scoreProjectMatch(project, { interests: ['Accessibility'] });

    expect(result.score).toBe(20);
    expect(result.reasons).toEqual(['1 shared interest', 'Currently recruiting']);
  });
});
