import mongoose, { Schema } from 'mongoose';
import { IUser } from './User.model';

export interface IFaculty extends IUser {
  title: string;
  bio: string;
  rating: number;
  reviews: number;
  students: number;
  courses: number;
}

const FacultySchema = new Schema<IFaculty>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    fullName: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    profilePicture: { type: String, default: 'https://i.pravatar.cc/150?u=faculty' },
    role: { type: String, default: 'faculty' },
    phone: { type: String, default: '' },
    headline: { type: String, default: '' },
    registerNumber: { type: String, default: '' },
    degree: { type: String, default: '' },
    batch: { type: String, default: '' },
    college: { type: String, default: '' },
    aboutMe: { type: String, default: '' },
    enrollments: [{ type: Schema.Types.Mixed }],
    certificates: [{ type: Schema.Types.Mixed }],
    notes: [{ type: Schema.Types.Mixed }],
    notifications: [{ type: Schema.Types.Mixed }],
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
    },
    
    // Faculty-specific fields
    title: { type: String, default: '' },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    students: { type: Number, default: 0 },
    courses: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Index for faster queries (email index already created by unique: true)
FacultySchema.index({ rating: -1 });

export default mongoose.model<IFaculty>('Faculty', FacultySchema);
