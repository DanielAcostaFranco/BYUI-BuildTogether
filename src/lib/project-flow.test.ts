import { describe, expect, it } from 'vitest';
import { canAcceptApplication, recruitmentStatus, roleVacancies } from './project-flow';

const roles = [
  { id: 'design', title: 'Designer', description: 'Design the product.', skills: ['Figma'], peopleNeeded: 1 },
  { id: 'research', title: 'Researcher', description: 'Interview students.', skills: ['Research'], peopleNeeded: 2 }
];

describe('project recruitment', () => {
  it('counts only accepted members assigned to each position', () => {
    expect(roleVacancies(roles, [{ roleId: 'design' }, { roleId: 'research' }]).map(({ remaining }) => remaining)).toEqual([0, 1]);
  });

  it('closes recruitment when all positions are filled, even if team size is larger', () => {
    const vacancies = roleVacancies(roles, [{ roleId: 'design' }, { roleId: 'research' }, { roleId: 'research' }]);
    expect(recruitmentStatus('Recruiting', 8, 4, vacancies)).toBe('In progress');
  });

  it('closes recruitment at total team capacity and does not reopen an in-progress project', () => {
    expect(recruitmentStatus('Recruiting', 3, 3, roleVacancies(roles, []))).toBe('In progress');
    expect(recruitmentStatus('In progress', 3, 2, roleVacancies(roles, []))).toBe('In progress');
  });

  it('rejects a filled position and a project that is no longer recruiting', () => {
    expect(canAcceptApplication('Recruiting', 4, 2, 0)).toBe(false);
    expect(canAcceptApplication('In progress', 4, 2, 1)).toBe(false);
    expect(canAcceptApplication('Recruiting', 4, 2, 1)).toBe(true);
  });
});
