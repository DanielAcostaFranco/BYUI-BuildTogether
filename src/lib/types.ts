export type ProjectCategory = 'Technology' | 'Design' | 'Community' | 'Business' | 'Research';
export type LocationType = 'Remote' | 'Hybrid' | 'In person';
export type ProjectStatus = 'Recruiting' | 'Idea';
export type ProjectRole = { title: string; description: string; skills: string[]; peopleNeeded: number };

export type Project = {
  id: string;
  creatorId?: string;
  title: string;
  summary: string;
  category: ProjectCategory;
  status: ProjectStatus;
  department: string;
  creator: string;
  initials: string;
  skills: string[];
  interests?: string[];
  roles?: ProjectRole[];
  hoursPerWeek: string;
  location: LocationType;
  openRoles: number;
  teamSize?: number;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: 'campus-rideshare',
    title: 'Campus Rideshare',
    summary: 'A safer, simpler way for students to coordinate rides between campus and nearby communities.',
    category: 'Technology',
    status: 'Recruiting',
    department: 'Computer Science',
    creator: 'Alex Morgan',
    initials: 'AM',
    skills: ['Product design', 'React Native', 'Research'],
    hoursPerWeek: '3–5 hrs / week',
    location: 'Hybrid',
    openRoles: 3,
    featured: true
  },
  {
    id: 'food-waste-map',
    title: 'Food Waste Map',
    summary: 'Map local food waste patterns and prototype a resource that connects surplus food with students.',
    category: 'Community',
    status: 'Recruiting',
    department: 'Business',
    creator: 'Sofia Wilson',
    initials: 'SW',
    skills: ['Data research', 'Figma', 'Community'],
    hoursPerWeek: '2–4 hrs / week',
    location: 'In person',
    openRoles: 2
  },
  {
    id: 'viking-voices',
    title: 'Viking Voices',
    summary: 'A student-led podcast sharing the stories, projects, and lessons behind campus life.',
    category: 'Community',
    status: 'Recruiting',
    department: 'Communication',
    creator: 'Noah Lee',
    initials: 'NL',
    skills: ['Storytelling', 'Audio editing', 'Social'],
    hoursPerWeek: '4–6 hrs / week',
    location: 'Remote',
    openRoles: 2
  },
  {
    id: 'rexburg-first-week',
    title: 'A better first week in Rexburg',
    summary: 'Student research exploring how new students find community, resources, and belonging.',
    category: 'Research',
    status: 'Idea',
    department: 'Social Sciences',
    creator: 'Daniel',
    initials: 'D',
    skills: ['Interviews', 'Figma', 'Community'],
    hoursPerWeek: '3 hrs / week',
    location: 'Hybrid',
    openRoles: 4
  },
  {
    id: 'viking-market',
    title: 'Viking Market',
    summary: 'A student marketplace concept for sharing small businesses, handmade goods, and services.',
    category: 'Business',
    status: 'Recruiting',
    department: 'Business Management',
    creator: 'Daniel',
    initials: 'D',
    skills: ['Branding', 'Marketing', 'Web development'],
    hoursPerWeek: '2–4 hrs / week',
    location: 'Remote',
    openRoles: 3
  },
  {
    id: 'accessible-campus',
    title: 'Accessible Campus Guide',
    summary: 'A collaborative guide to make navigating campus easier for students with different access needs.',
    category: 'Design',
    status: 'Recruiting',
    department: 'Design & Construction Management',
    creator: 'Daniel',
    initials: 'D',
    skills: ['UX design', 'Mapping', 'Accessibility'],
    hoursPerWeek: '2–3 hrs / week',
    location: 'In person',
    openRoles: 2
  }
];

export function filterProjects(items: Project[], query: string, category: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((project) => {
    const searchable = [project.title, project.summary, project.department, project.creator, ...project.skills]
      .join(' ')
      .toLowerCase();
    const matchesQuery = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
    const matchesCategory = category === 'All projects' || project.category === category;
    return matchesQuery && matchesCategory;
  });
}

export function filterDashboardProjects(items: Project[], query: string, category: string, status: string, location: string) {
  return filterProjects(items, query, category).filter((project) =>
    (status === 'Any status' || project.status === status) &&
    (location === 'Any location' || project.location === location)
  );
}
