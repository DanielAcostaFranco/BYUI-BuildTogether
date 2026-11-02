import { describe, expect, it } from 'vitest';
import { filterDashboardProjects, filterProjects, projects } from './types';

describe('filterProjects', () => {
  it('returns every project when query and category are empty', () => {
    expect(filterProjects(projects, '', 'All projects')).toHaveLength(projects.length);
  });

  it('matches project skills and department case-insensitively', () => {
    expect(filterProjects(projects, 'figma', 'All projects').map((project) => project.id)).toEqual([
      'food-waste-map'
    ]);
  });

  it('combines a text query and category filter', () => {
    expect(filterProjects(projects, 'podcast', 'Community')).toHaveLength(1);
    expect(filterProjects(projects, 'community', 'Community')).toHaveLength(1);
  });
});

describe('filterDashboardProjects', () => {
  it('combines category, status, and location without changing the source list', () => {
    const result = filterDashboardProjects(projects, '', 'Community', 'Recruiting', 'Remote');
    expect(result.map((project) => project.id)).toEqual(['viking-voices']);
    expect(projects).toHaveLength(5);
  });

  it('returns no projects when filters have no match', () => {
    expect(filterDashboardProjects(projects, 'rideshare', 'Business', 'Any status', 'Any location')).toEqual([]);
  });
});
