export interface PersonalDetails {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  website: string;
  profilePicture: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link: string;
}

export interface ResumeData {
  personalDetails: PersonalDetails;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
}

export type SectionType = 'summary' | 'experience' | 'education' | 'skills' | 'projects';

export interface Section {
  id: SectionType;
  title: string;
}

export const sectionsConfig: Section[] = [
  { id: 'summary', title: 'Professional Summary' },
  { id: 'experience', title: 'Work Experience' },
  { id: 'education', title: 'Education' },
  { id: 'projects', title: 'Projects' },
  { id: 'skills', title: 'Skills' },
];

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;

export const initialResumeData: ResumeData = {
  personalDetails: {
    fullName: 'Enzuu',
    jobTitle: 'Full-Stack Developer',
    email: 'enzuu@example.com',
    phone: '(123) 456-7890',
    address: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/enzuu',
    website: 'enzuu.dev',
    profilePicture: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzkyOTQ5NiI+PHBhdGggZD0iTTEyIDJDNi45MSAyIDIgNi45MSAyIDEyczQuOTEgMTAgMTAgMTAgMTAtNC45MSAxMC0xMFMxNy4wOSAyIDEyIDJ6bTAgNWMxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTRjLTIuNjcgMC01LTEuMjgtNi45LTMuMjkuMDQtMy4xMyA0LjM4LTUuMDIgNi41LTUuMDIgMi4xMiAwIDYuNDYgMS44OSA2LjUgNS4wMi0xLjUgMi4wMS0zLjgzIDMuMjgtNi41IDMuMjgiLz48L3N2Zz4=',
  },
  summary: 'Innovative and deadline-driven Software Engineer with 5+ years of experience designing and developing user-centered digital products from initial concept to final, polished deliverable.',
  experience: [
    {
      id: uid(),
      company: 'Tech Solutions Inc.',
      role: 'Senior Software Engineer',
      startDate: 'Jan 2021',
      endDate: 'Present',
      description: '- Led a team of 5 engineers in developing a new microservices-based architecture, improving system scalability by 40%.\n- Developed and maintained critical components for the company\'s flagship SaaS product using React and Node.js.\n- Implemented a CI/CD pipeline which reduced deployment time by 75%.',
    },
    {
      id: uid(),
      company: 'Web Innovations',
      role: 'Software Engineer',
      startDate: 'Jun 2018',
      endDate: 'Dec 2020',
      description: '- Built responsive and accessible user interfaces for client websites using modern HTML, CSS, and JavaScript.\n- Collaborated with designers to translate wireframes into high-quality code.\n- Optimized web applications for maximum speed and scalability.',
    },
  ],
  education: [
    {
      id: uid(),
      institution: 'University of Technology',
      degree: 'M.S. in Computer Science',
      startDate: '2016',
      endDate: '2018',
      gpa: '3.9/4.0',
    },
    {
        id: uid(),
        institution: 'State University',
        degree: 'B.S. in Software Engineering',
        startDate: '2012',
        endDate: '2016',
        gpa: '3.7/4.0',
    }
  ],
  skills: [
    { id: uid(), name: 'JavaScript (ES6+)' },
    { id: uid(), name: 'React & Redux' },
    { id: uid(), name: 'Node.js & Express' },
    { id: uid(), name: 'PostgreSQL' },
    { id: uid(), name: 'Docker' },
    { id: uid(), name: 'CI/CD' },
    { id: uid(), name: 'Agile Methodologies' },
  ],
  projects: [
    {
        id: uid(),
        name: 'Project Alpha',
        description: 'A full-stack e-commerce platform with features like product search, cart management, and a secure checkout process.',
        link: 'github.com/enzuu/alpha'
    },
    {
        id: uid(),
        name: 'Portfolio Website',
        description: 'Personal portfolio website built with React and Framer Motion to showcase my projects and skills.',
        link: 'enzuu.dev'
    }
  ]
};