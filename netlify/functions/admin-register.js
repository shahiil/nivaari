const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in environment variables');
}

// MongoDB connection helper
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const connection = await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB Atlas');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Admin Invite Schema
const AdminInviteSchema = new mongoose.Schema(
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

// User Schema
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['citizen', 'admin', 'supervisor'],
      default: 'citizen',
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const AdminInvite = mongoose.models.AdminInvite || mongoose.model('AdminInvite', AdminInviteSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    await connectToDatabase();

    if (event.httpMethod === 'GET') {
      // Validate invite token
      const { token } = event.queryStringParameters || {};
      
      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Token is required' }),
        };
      }

      const invite = await AdminInvite.findOne({ 
        token,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!invite) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Invalid or expired invite token' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          valid: true,
          email: invite.email,
          role: invite.role,
        }),
      };
    }

    if (event.httpMethod === 'POST') {
      // Register admin/supervisor with invite token
      const { token, name, password, confirmPassword } = JSON.parse(event.body);
      
      if (!token || !name || !password || !confirmPassword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'All fields are required' }),
        };
      }

      if (password !== confirmPassword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Passwords do not match' }),
        };
      }

      // Find and validate invite
      const invite = await AdminInvite.findOne({ 
        token,
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!invite) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Invalid or expired invite token' }),
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: invite.email });
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already registered' }),
        };
      }

      // Create user
      const user = new User({
        name,
        email: invite.email,
        password,
        role: invite.role,
        status: 'online',
      });

      await user.save();

      // Mark invite as used
      await AdminInvite.findByIdAndUpdate(invite._id, {
        used: true,
        usedAt: new Date(),
      });

      // Generate token
      const jwtToken = generateToken(user);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Account created successfully!',
          user: user.toJSON(),
          token: jwtToken,
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Admin register error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};