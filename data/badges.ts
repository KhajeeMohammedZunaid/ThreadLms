import React from 'react';
import { Course } from './courses';
import {
    Sparkles,
    Code,
    GitBranch,
    CheckCircle2,
    Calendar,
    Zap,
    MessageSquare,
    Sunrise,
    GraduationCap,
    Database,
    Palette,
    BrainCircuit,
    Container,
    CircuitBoard,
    Thermometer,
    Building,
} from 'lucide-react';


const badgeIcons = [
    React.createElement(Sparkles, { key: 1, className: "w-10 h-10 text-primary" }),
    React.createElement(Code, { key: 2, className: "w-10 h-10 text-primary" }),
    React.createElement(GitBranch, { key: 3, className: "w-10 h-10 text-primary" }),
    React.createElement(CheckCircle2, { key: 4, className: "w-10 h-10 text-primary" }),
    React.createElement(Calendar, { key: 5, className: "w-10 h-10 text-primary" }),
    React.createElement(Zap, { key: 6, className: "w-10 h-10 text-primary" }),
    React.createElement(MessageSquare, { key: 7, className: "w-10 h-10 text-primary" }),
    React.createElement(Sunrise, { key: 8, className: "w-10 h-10 text-primary" }),
    React.createElement(GraduationCap, { key: 9, className: "w-10 h-10 text-primary" }),
    React.createElement(Database, { key: 10, className: "w-10 h-10 text-primary" }),
    React.createElement(Palette, { key: 11, className: "w-10 h-10 text-primary" }),
    React.createElement(BrainCircuit, { key: 12, className: "w-10 h-10 text-primary" }),
    React.createElement(Container, { key: 13, className: "w-10 h-10 text-primary" }),
    React.createElement(CircuitBoard, { key: 14, className: "w-10 h-10 text-primary" }),
    React.createElement(Thermometer, { key: 15, className: "w-10 h-10 text-primary" }),
    React.createElement(Building, { key: 16, className: "w-10 h-10 text-primary" }),
];


export type BadgeInfo = {
  id: number;
  name: string;
  description: string;
  icon: React.ReactElement;
  branch?: Course['branch'];
};

export const badges: BadgeInfo[] = [
  { id: 1, name: 'React Expert', description: 'Completed 5 React courses', icon: badgeIcons[0] },
  { id: 2, name: 'Frontend Master', description: 'Mastered HTML, CSS, and JS', icon: badgeIcons[1] },
  { id: 3, name: 'Code Contributor', description: 'Submitted 10 IDE projects', icon: badgeIcons[2] },
  { id: 4, name: 'Perfect Score', description: 'Achieved 100% on a quiz', icon: badgeIcons[3] },
  { id: 5, name: 'Weekend Warrior', description: 'Studied on a weekend', icon: badgeIcons[4] },
  { id: 6, name: 'Quick Learner', description: 'Finished a course in one day', icon: badgeIcons[5] },
  { id: 7, name: 'Community Helper', description: 'Answered 5 forum questions', icon: badgeIcons[6] },
  { id: 8, name: 'Early Bird', description: 'Logged in before 8 AM', icon: badgeIcons[7] },
  { id: 9, name: 'Full-Stack Hero', description: 'Completed the Full-Stack Bootcamp', icon: badgeIcons[8], branch: 'Computer Science' },
  { id: 10, name: 'Node.js Ninja', description: 'Mastered advanced Node.js concepts', icon: badgeIcons[9] },
  { id: 11, name: 'Pixel Perfect', description: 'Finished the UI/UX Design course', icon: badgeIcons[10] },
  { id: 12, name: 'Python Pro', description: 'Completed Data Structures in Python', icon: badgeIcons[11] },
  { id: 13, name: 'Docker Captain', description: 'Containerized an application', icon: badgeIcons[12] },
  { id: 14, name: 'Circuit Wizard', description: 'Mastered circuit analysis', icon: badgeIcons[13], branch: 'Electrical' },
  { id: 15, name: 'Thermo Titan', description: 'Conquered thermodynamics', icon: badgeIcons[14], branch: 'Mechanical' },
  { id: 16, name: 'Structure Sage', description: 'Aced structural engineering basics', icon: badgeIcons[15], branch: 'Civil' },
];

export const getBadgeForBranch = (branch: Course['branch']): BadgeInfo | undefined => {
    return badges.find(b => b.branch === branch);
};