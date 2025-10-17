import mongoose, { Schema, Document, Types } from 'mongoose';
import { CourseBranch } from '../types';

export interface IProject extends Document {
  title: string;
  description: string;
  imageUrl: string;
  authorId: Types.ObjectId;
  authorName: string;
  authorAvatar: string;
  tags: string[];
  likes: number;
  views: number;
  projectUrl: string;
  branch: CourseBranch;
  category: string;
  likedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    likes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    projectUrl: { type: String, required: true },
    branch: { 
      type: String, 
      enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil'], 
      required: true 
    },
    category: { type: String, required: true },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
ProjectSchema.index({ title: 'text', description: 'text' });
ProjectSchema.index({ branch: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ authorId: 1 });
ProjectSchema.index({ likes: -1 });
ProjectSchema.index({ createdAt: -1 });

export default mongoose.model<IProject>('Project', ProjectSchema);
