import type { ProjectRole, ProjectStatus } from './types';

export function roleId(role: ProjectRole, index: number) {
  return role.id ?? `legacy-role-${index}`;
}

export function roleVacancies(roles: ProjectRole[], members: Array<{ roleId?: string }>) {
  return roles.map((role, index) => {
    const id = roleId(role, index);
    const filled = members.filter((member) => member.roleId === id).length;
    return { id, title: role.title, needed: role.peopleNeeded, filled, remaining: Math.max(0, role.peopleNeeded - filled) };
  });
}

export function recruitmentStatus(status: ProjectStatus, teamSize: number, memberCount: number, vacancies: Array<{ remaining: number }>): ProjectStatus {
  if (status === 'Completed' || status === 'In progress') return status;
  return memberCount >= teamSize || vacancies.every((vacancy) => vacancy.remaining === 0) ? 'In progress' : status;
}

export function canAcceptApplication(status: ProjectStatus, teamSize: number, memberCount: number, roleRemaining: number) {
  return (status === 'Recruiting' || status === 'Idea') && memberCount < teamSize && roleRemaining > 0;
}
