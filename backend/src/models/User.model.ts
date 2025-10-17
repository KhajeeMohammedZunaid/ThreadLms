import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationType } from '../types';

// Notification subdocument
interface INotification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: Date;
  isRead: boolean;
  link: string;
}

// Note subdocument
interface INote {
  id: string;
  title: string;
  content: string;
  color: string;
  dueDate?: Date;
  authorName?: string;
  isPublished?: boolean;
  courseId?: Types.ObjectId;
  courseTitle?: string;
}

// Certificate subdocument
interface ICertificate {
  id: string;
  courseId: Types.ObjectId;
  courseTitle: string;
  completionDate: Date;
}

// Enrollment subdocument
interface IEnrollment {
  courseId: Types.ObjectId;
  completedItems: string[];
  enrollmentDate: Date;
  completionDate?: Date;
  completionAcknowledged?: boolean;
  assignmentSubmissions?: Array<{
    itemId: string;
    submissionLink: string;
    submissionDate: Date;
    grade?: number;
    feedback?: string;
  }>;
  quizScores?: Array<{
    itemId: string;
    score: number;
  }>;
  finalQuizScore?: number;
  inProgressQuizAnswers?: Map<string, any>;
  courseNotes?: Map<string, string>;
}

export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  role: 'student' | 'faculty';
  phone: string;
  headline: string;
  registerNumber: string;
  degree: string;
  batch: string;
  college: string;
  aboutMe: string;
  enrollments: IEnrollment[];
  certificates: ICertificate[];
  notes: INote[];
  notifications: INotification[];
  notificationSettings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    courseUpdates: boolean;
    projectComments: boolean;
    collaborationInvites: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  link: { type: String, required: true }
});

const NoteSchema = new Schema<INote>({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  color: { type: String, required: true },
  dueDate: Date,
  authorName: String,
  isPublished: Boolean,
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  courseTitle: String
});

const CertificateSchema = new Schema<ICertificate>({
  id: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: { type: String, required: true },
  completionDate: { type: Date, required: true }
});

const EnrollmentSchema = new Schema<IEnrollment>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  completedItems: [String],
  enrollmentDate: { type: Date, default: Date.now },
  completionDate: Date,
  completionAcknowledged: Boolean,
  assignmentSubmissions: [{
    itemId: String,
    submissionLink: String,
    submissionDate: Date,
    grade: Number,
    feedback: String
  }],
  quizScores: [{
    itemId: String,
    score: Number
  }],
  finalQuizScore: Number,
  inProgressQuizAnswers: { type: Map, of: Schema.Types.Mixed },
  courseNotes: { type: Map, of: String }
});

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    fullName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePicture: { type: String, default: 'https://i.pravatar.cc/150?u=default' },
    role: { type: String, enum: ['student', 'faculty'], default: 'student' },
    phone: { type: String, default: '' },
    headline: { type: String, default: '' },
    registerNumber: { type: String, default: '' },
    degree: { type: String, default: '' },
    batch: { type: String, default: '' },
    college: { type: String, default: '' },
    aboutMe: { type: String, default: '' },
    enrollments: [EnrollmentSchema],
    certificates: [CertificateSchema],
    notes: [NoteSchema],
    notifications: [NotificationSchema],
    notificationSettings: {
      type: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        courseUpdates: { type: Boolean, default: true },
        projectComments: { type: Boolean, default: true },
        collaborationInvites: { type: Boolean, default: true }
      },
      default: {
        emailNotifications: true,
        pushNotifications: true,
        courseUpdates: true,
        projectComments: true,
        collaborationInvites: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries (email index already created by unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ 'enrollments.courseId': 1 });

export default mongoose.model<IUser>('User', UserSchema);
