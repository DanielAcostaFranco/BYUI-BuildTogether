import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.')
});

export const verifyCodeSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the six-digit code from your email.')
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  major: z.string().trim().min(2, 'Add your major.'),
  graduationYear: z.coerce.number().int().min(2026).max(2100),
  bio: z.string().trim().max(280, 'Keep your bio under 280 characters.'),
  skills: z.array(z.string().trim().min(1)).max(30).default([]),
  interests: z.array(z.string().trim().min(1)).max(20).default([]),
  links: z.array(z.object({
    label: z.string().trim().min(1).max(40),
    url: z.string().trim().url('Enter a complete URL, such as https://github.com/yourname.')
  })).max(8).default([]),
  previousProjects: z.array(z.object({
    title: z.string().trim().min(1, 'Add a project title.').max(80),
    description: z.string().trim().max(280, 'Keep the project description under 280 characters.'),
    url: z.string().trim().refine((value) => value === '' || /^https?:\/\//.test(value), 'Use a complete URL starting with http:// or https://.')
  })).max(8).default([]),
  avatarUrl: z.string().max(2_500_000, 'Your image must be smaller than 2 MB.').regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Use a JPG, PNG, or WebP image.').nullable().default(null)
});

export const projectSchema = z.object({
  title: z.string().trim().min(3, 'Add a project title.').max(100),
  summary: z.string().trim().min(20, 'Tell people a little more about the project.').max(360),
  category: z.enum(['Technology', 'Design', 'Community', 'Business', 'Research']),
  status: z.enum(['Recruiting', 'Idea', 'In progress', 'Completed']).optional(),
  department: z.string().trim().min(2, 'Add the department or academic area.').max(80),
  skills: z.array(z.string().trim().min(1)).min(1, 'Add at least one skill.').max(12),
  interests: z.array(z.string().trim().min(1)).max(12).default([]),
  roles: z.array(z.object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(2, 'Add a role title.'),
    description: z.string().trim().min(10, 'Describe what this role would do.').max(220),
    skills: z.array(z.string().trim().min(1)).min(1, 'Add at least one skill to each role.').max(8),
    peopleNeeded: z.coerce.number().int().min(1).max(30)
  })).min(1, 'Add at least one team need.').max(8),
  links: z.array(z.object({
    label: z.string().trim().min(1).max(50),
    url: z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), 'Use an http or https link.')
  })).max(8).default([]),
  hoursPerWeek: z.string().trim().min(1, 'Choose an estimated time commitment.'),
  location: z.enum(['Remote', 'Hybrid', 'In person']),
  openRoles: z.coerce.number().int().min(1).max(30),
  teamSize: z.coerce.number().int().min(1).max(30),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the community guidelines.' }) })
}).refine(({ teamSize, roles }) => teamSize >= roles.reduce((total, role) => total + role.peopleNeeded, 1), {
  path: ['teamSize'],
  message: 'Team size must include you and everyone needed for each position.'
}).refine(({ roles }) => {
  const ids = roles.map((role) => role.id).filter((id): id is string => Boolean(id));
  return new Set(ids).size === ids.length;
}, {
  path: ['roles'],
  message: 'Each position needs a unique ID.'
});

export const applicationSchema = z.object({
  roleId: z.string().trim().min(1, 'Choose a position.'),
  message: z.string().trim().min(20, 'Tell the team why you want to join (at least 20 characters).').max(500, 'Keep your answer under 500 characters.'),
  contribution: z.string().trim().min(20, 'Explain how you could help (at least 20 characters).').max(500, 'Keep your answer under 500 characters.'),
  experienceLevel: z.enum(['Relevant experience', 'Some experience', 'New to this'], { required_error: 'Choose your experience level.' }),
  experienceDetails: z.string().trim().max(700, 'Keep your experience under 700 characters.'),
  workSampleUrl: z.string().trim().max(300).refine((value) => !value || /^https?:\/\//i.test(value) && z.string().url().safeParse(value).success, 'Use a complete http or https link.').default(''),
  availabilityHours: z.enum(['1–2 hours', '3–5 hours', '6–10 hours', '10+ hours'], { required_error: 'Choose your weekly availability.' })
}).superRefine(({ experienceLevel, experienceDetails }, context) => {
  if (experienceLevel !== 'New to this' && experienceDetails.length < 20) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['experienceDetails'], message: 'Describe your relevant experience or past work (at least 20 characters).' });
  }
});

export const projectUpdateSchema = z.object({
  text: z.string().trim().min(10, 'Write at least 10 characters.').max(1000, 'Keep updates under 1,000 characters.')
});

export const workspaceLinkSchema = z.object({
  label: z.string().trim().min(1, 'Add a label.').max(60),
  url: z.string().trim().url('Enter a complete URL.').refine((value) => /^https?:\/\//i.test(value), 'Use an http or https link.')
});

export const teamProfileVisibilitySchema = z.object({
  major: z.boolean(), graduationYear: z.boolean(), bio: z.boolean(), skills: z.boolean(),
  interests: z.boolean(), links: z.boolean(), previousProjects: z.boolean(), avatar: z.boolean()
});
