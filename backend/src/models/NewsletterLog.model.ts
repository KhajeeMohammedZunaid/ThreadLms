import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterLog extends Document {
  sentDate: Date;
  subject: string;
  recipientCount: number;
  storiesCount: number;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterLogSchema = new Schema<INewsletterLog>(
  {
    sentDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    recipientCount: {
      type: Number,
      required: true,
      default: 0
    },
    storiesCount: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for querying recent newsletters
NewsletterLogSchema.index({ sentDate: -1 });
NewsletterLogSchema.index({ status: 1 });

export default mongoose.model<INewsletterLog>('NewsletterLog', NewsletterLogSchema);
