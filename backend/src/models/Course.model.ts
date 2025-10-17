import mongoose, { Schema, Document, Types } from 'mongoose';
import { CourseBranch, ContentItemType } from '../types';

interface IQuizQuestion {
  questionText: string;
  answerOptions: Array<{
    answerText: string;
    isCorrect: boolean;
  }>;
}

interface ICourseResource {
  name: string;
  url: string;
}

interface ICourseContentItem {
  type: ContentItemType;
  title: string;
  duration: string;
  description?: string;
  videoUrl?: string;
  videoType?: 'youtube' | 'upload';
  questions?: IQuizQuestion[];
  timeLimit?: number;
  isGraded?: boolean;
}

interface ICourseSection {
  sectionTitle: string;
  items: ICourseContentItem[];
  resources?: ICourseResource[];
}

interface IDiscussionReply {
  id: string;
  author: string;
  avatar: string;
  timestamp: Date;
  content: string;
  upvotes: number;
  authorRole: 'student' | 'faculty';
}

interface IDiscussionThread {
  id: string;
  author: string;
  avatar: string;
  timestamp: Date;
  title: string;
  content: string;
  upvotes: number;
  authorRole: 'student' | 'faculty';
  replies: IDiscussionReply[];
}

export interface ICourse extends Document {
  title: string;
  subtitle: string;
  branch: CourseBranch;
  category: string;
  bestseller: boolean;
  duration: string;
  totalLength: string;
  imageUrl: string;
  students: number;
  lessons: number;
  rating: number;
  reviews: number;
  authorId: Types.ObjectId;
  updated: Date;
  description: string;
  learnings: string[];
  previewUrl: string;
  requirements: string[];
  includes: string[];
  content: ICourseSection[];
  discussion?: IDiscussionThread[];
  finalQuiz?: {
    title: string;
    isEnabled: boolean;
    questions: IQuizQuestion[];
    timeLimit?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
  questionText: { type: String, required: true },
  answerOptions: [{
    answerText: { type: String, required: true },
    isCorrect: { type: Boolean, required: true }
  }]
}, { _id: false });

const CourseResourceSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const CourseContentItemSchema = new Schema({
  type: { type: String, enum: ['lecture', 'quiz', 'assignment'], required: true },
  title: { type: String, required: true },
  duration: { type: String, required: true },
  description: String,
  videoUrl: String,
  videoType: { type: String, enum: ['youtube', 'upload'] },
  questions: [QuizQuestionSchema],
  timeLimit: Number,
  isGraded: Boolean
}, { _id: false });

const CourseSectionSchema = new Schema({
  sectionTitle: { type: String, required: true },
  items: [CourseContentItemSchema],
  resources: [CourseResourceSchema]
}, { _id: false });

const DiscussionReplySchema = new Schema({
  id: { type: String, required: true },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  content: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  authorRole: { type: String, enum: ['student', 'faculty'], required: true }
}, { _id: false });

const DiscussionThreadSchema = new Schema({
  id: { type: String, required: true },
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  title: { type: String, required: true },
  content: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  authorRole: { type: String, enum: ['student', 'faculty'], required: true },
  replies: [DiscussionReplySchema]
}, { _id: false });

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true },
    branch: { 
      type: String, 
      enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil'], 
      required: true 
    },
    category: { type: String, required: true },
    bestseller: { type: Boolean, default: false },
    duration: { type: String, required: true },
    totalLength: { type: String, required: true },
    imageUrl: { type: String, required: true },
    students: { type: Number, default: 0 },
    lessons: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
    updated: { type: Date, default: Date.now },
    description: { type: String, required: true },
    learnings: [String],
    previewUrl: { type: String, default: '' },
    requirements: [String],
    includes: [String],
    content: [CourseSectionSchema],
    discussion: [DiscussionThreadSchema],
    finalQuiz: {
      title: String,
      isEnabled: { type: Boolean, default: false },
      questions: [QuizQuestionSchema],
      timeLimit: Number
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ branch: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ authorId: 1 });
CourseSchema.index({ rating: -1 });

export default mongoose.model<ICourse>('Course', CourseSchema);
