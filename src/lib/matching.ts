import type { Project } from './types';

export type MatchProfile = {
  major?: string;
  skills?: string[];
  interests?: string[];
};

export type ProjectMatch = {
  project: Project;
  score: number;
  reasons: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function projectSkills(project: Project) {
  return [...project.skills, ...(project.roles ?? []).flatMap((role) => role.skills)];
}

function projectInterests(project: Project) {
  return (project.interests ?? []).map(normalize);
}

export function scoreProjectMatch(project: Project, profile: MatchProfile): ProjectMatch {
  const studentSkills = new Set((profile.skills ?? []).map(normalize));
  const studentInterests = new Set((profile.interests ?? []).map(normalize));
  const matchingSkills = [...new Set(projectSkills(project).map(normalize))]
    .filter((skill) => studentSkills.has(skill));
  const matchingInterests = projectInterests(project)
    .filter((interest) => studentInterests.has(interest));
  const reasons: string[] = [];
  let score = Math.min(matchingSkills.length * 15, 60);
  score += Math.min(matchingInterests.length * 10, 20);

  if (matchingSkills.length > 0) {
    reasons.push(`${matchingSkills.length} matching skill${matchingSkills.length === 1 ? '' : 's'}`);
  }

  if (matchingInterests.length > 0) {
    reasons.push(`${matchingInterests.length} shared interest${matchingInterests.length === 1 ? '' : 's'}`);
  }

  const major = normalize(profile.major ?? '');
  const department = normalize(project.department);
  if (major && (department.includes(major) || major.includes(department))) {
    score += 25;
    reasons.push('Your major fits this project');
  }

  if (project.status === 'Recruiting') {
    score += 10;
    reasons.push('Currently recruiting');
  }

  if (reasons.length === 0) reasons.push('Explore this project');
  return { project, score: Math.min(score, 100), reasons };
}

export function rankProjects(projects: Project[], profile: MatchProfile) {
  return projects
    .map((project) => scoreProjectMatch(project, profile))
    .sort((left, right) => right.score - left.score || left.project.title.localeCompare(right.project.title));
}
