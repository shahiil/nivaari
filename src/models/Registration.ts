import mongoose from 'mongoose';

export interface IRegistration extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventInfo: {
    title: string;
    description?: string;
    eventType: string;
    location?: {
      address?: string;
      coordinates?: [number, number]; // [longitude, latitude]
    };
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  registrationData: Record<string, any>; // Flexible data for different event types
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new mongoose.Schema<IRegistration>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventInfo: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      eventType: {
        type: String,
        required: true,
      },
      location: {
        address: String,
        coordinates: {
          type: [Number],
          index: '2dsphere', // For geospatial queries
        },
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    registrationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
RegistrationSchema.index({ userId: 1, createdAt: -1 });
RegistrationSchema.index({ 'eventInfo.eventType': 1 });
RegistrationSchema.index({ status: 1 });

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);