import mongoose from 'mongoose';

export interface IEmailLog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientUserId?: mongoose.Types.ObjectId;
  emailType: 'invitation' | 'registration_confirmation' | 'password_reset' | 'notification';
  subject: string;
  content?: string; // Optional: store email content for auditing
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
  metadata?: Record<string, any>; // Additional data like invite tokens, etc.
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new mongoose.Schema<IEmailLog>(
  {
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emailType: {
      type: String,
      enum: ['invitation', 'registration_confirmation', 'password_reset', 'notification'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EmailLogSchema.index({ recipientEmail: 1, createdAt: -1 });
EmailLogSchema.index({ emailType: 1 });
EmailLogSchema.index({ status: 1 });
EmailLogSchema.index({ sentAt: -1 });

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);