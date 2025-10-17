import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'student' | 'faculty';
    email: string;
  };
}

export type UserRole = 'student' | 'faculty';

export type NotificationType = 
  | 'COURSE_UPDATE' 
  | 'NEW_COURSE' 
  | 'DISCUSSION_REPLY' 
  | 'WELCOME' 
  | 'GRADE_UPDATE' 
  | 'COLLABORATION_REQUEST' 
  | 'NEW_ENROLLMENT' 
  | 'QUIZ_ATTEMPT' 
  | 'SUBMISSION' 
  | 'NEW_DISCUSSION_POST';

export type CourseBranch = 'Computer Science' | 'Electrical' | 'Mechanical' | 'Civil';

export type ContentItemType = 'lecture' | 'quiz' | 'assignment';

export type QuestionStatus = 'answered' | 'notAnswered' | 'markedForReview' | 'answeredAndMarked' | 'notVisited';
