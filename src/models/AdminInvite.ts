import mongoose from 'mongoose';

export interface IAdminInvite extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  token: string;
  email: string;
  role: 'admin' | 'supervisor';
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminInviteSchema = new mongoose.Schema<IAdminInvite>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'supervisor'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AdminInviteSchema.index({ token: 1 });
AdminInviteSchema.index({ email: 1 });
AdminInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export const AdminInvite = mongoose.model<IAdminInvite>('AdminInvite', AdminInviteSchema);