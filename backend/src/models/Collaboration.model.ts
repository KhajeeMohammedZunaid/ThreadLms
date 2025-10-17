import mongoose, { Schema, Document, Types } from 'mongoose';

interface ICollaborationMember {
  userId: Types.ObjectId;
  userName: string;
  userAvatar: string;
  joinedAt: Date;
}

interface ICollaborationRequest {
  userId: Types.ObjectId;
  requestedAt: Date;
}

export interface ICollaboration extends Document {
  title: string;
  description: string;
  branch: string;
  requiredSkills: string[];
  teamSize: number;
  authorId: Types.ObjectId;
  authorName: string;
  authorAvatar: string;
  members: ICollaborationMember[];
  requests: ICollaborationRequest[];
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const CollaborationRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now }
}, { _id: false });

const CollaborationSchema = new Schema<ICollaboration>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    branch: { type: String, required: true },
    requiredSkills: [{ type: String, trim: true }],
    teamSize: { type: Number, required: true, min: 2, max: 20 },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String, required: true },
    members: [CollaborationMemberSchema],
    requests: [CollaborationRequestSchema]
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
CollaborationSchema.index({ title: 'text', description: 'text' });
CollaborationSchema.index({ branch: 1 });
CollaborationSchema.index({ authorId: 1 });
CollaborationSchema.index({ createdAt: -1 });

export default mongoose.model<ICollaboration>('Collaboration', CollaborationSchema);
