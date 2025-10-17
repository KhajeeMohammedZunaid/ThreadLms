// Central type definitions for the application
// These types are used across the application and fetched from backend APIs

// ============= Course Types =============
export type QuizQuestion = {
  questionText: string;
  answerOptions: {
    answerText: string;
    isCorrect: boolean;
  }[];
};

export type CourseResource = {
  name: string;
  url: string;
};

export type CourseContentItem = {
  type: 'lecture' | 'quiz' | 'assignment';
  title: string;
  duration: string;
  description?: string;
  questions?: QuizQuestion[];
  timeLimit?: number; // in minutes
  isGraded?: boolean;
  videoUrl?: string;
  videoType?: 'youtube' | 'upload';
};

export type CourseSection = {
  sectionTitle: string;
  items: CourseContentItem[];
  resources?: CourseResource[];
};

export type DiscussionReply = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  content: string;
  upvotes: number;
  authorRole: 'student' | 'faculty';
};

export type DiscussionThread = {
  id: string;
  author: string;
  avatar: string;
  timestamp: string;
  title: string;
  content: string;
  upvotes: number;
  replies: DiscussionReply[];
};

export type Course = {
  id: number;
  isEnrolled: boolean;
  title: string;
  subtitle: string;
  branch: 'Computer Science' | 'Electrical' | 'Mechanical' | 'Civil';
  category: string;
  bestseller: boolean;
  duration: string;
  totalLength: string;
  progress: number;
  imageUrl: string;
  students: number;
  lessons: number;
  rating: number;
  reviews: number;
  authorId: number;
  updated: string;
  description: string;
  learnings: string[];
  previewUrl: string;
  requirements: string[];
  includes: string[];
  content: CourseSection[];
  discussion?: DiscussionThread[];
  finalQuiz?: {
    title: string;
    isEnabled: boolean;
    questions: QuizQuestion[];
    timeLimit?: number;
  };
};

// ============= User Types =============
export type Notification = {
  id: string;
  type: 'COURSE_UPDATE' | 'NEW_COURSE' | 'DISCUSSION_REPLY' | 'WELCOME' | 'GRADE_UPDATE' | 'COLLABORATION_REQUEST' | 'NEW_ENROLLMENT' | 'QUIZ_ATTEMPT' | 'SUBMISSION' | 'NEW_DISCUSSION_POST';
  message: string;
  timestamp: string;
  isRead: boolean;
  link: string;
};

export type Certificate = {
  id: string;
  courseId: number;
  courseTitle: string;
  completionDate: string;
};

export type Enrollment = {
  courseId: number;
  completedItems: string[];
  enrollmentDate: string;
  completionDate?: string;
  completionAcknowledged?: boolean;
  assignmentSubmissions?: {
    itemId: string;
    submissionLink: string;
    submissionDate: string;
    grade?: number;
    feedback?: string;
  }[];
  quizScores?: {
    itemId: string;
    score: number;
  }[];
  finalQuizScore?: number;
  inProgressQuizAnswers?: {
    [itemId: string]: {
      answers: number[];
      statuses: string[];
    };
  };
  courseNotes?: {
    [itemId: string]: string;
  };
};

export type User = {
  id: number;
  email: string;
  password?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  role: 'student' | 'faculty';
  enrollments?: Enrollment[];
  certificates?: Certificate[];
  aboutMe: string;
  notes?: any[]; // Note type from StickyWall
  notifications?: Notification[];
  phone: string;
  headline: string;
  registerNumber: string;
  degree: string;
  batch: string;
  college: string;
};

export type Faculty = User & {
  role: 'faculty';
  title: string;
  bio: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
};

// ============= Project Types =============
export type Project = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  authorName: string;
  authorAvatar: string;
  tags: string[];
  likes: number;
  views: number;
  projectUrl: string;
  branch: 'Computer Science' | 'Electrical' | 'Mechanical' | 'Civil';
  category: 'Web Dev' | 'Design' | 'Backend' | 'Mobile' | 'Hardware' | '3D Modeling' | 'Analysis';
  isLiked: boolean;
};

// ============= Collaboration Types =============
export type CollaborationPost = {
  id: number;
  title: string;
  description: string;
  authorName: string;
  authorAvatar: string;
  requiredSkills: string[];
  branch: 'Computer Science' | 'Electrical' | 'Mechanical' | 'Civil' | 'Interdisciplinary';
  teamSize: number;
  members: { name: string; avatar: string; }[];
  isRequested?: boolean;
};

// ============= Utility Functions =============
export function calculateProgress(completedItems: string[], totalItems: number): number {
  if (!totalItems || totalItems === 0) return 0;
  return Math.min(100, Math.round((completedItems.length / totalItems ) * 100));
}
