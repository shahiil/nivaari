import { connectToDatabase } from '../config/mongodb';
import { User, type IUser, type UserRole } from '../models';
import { generateToken } from './jwt';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: IUser;
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      await connectToDatabase();

      const user = await User.findOne({ email: credentials.email }).select('+password');
      if (!user) {
        return { success: false, message: 'User not found. Please check your email or sign up.' };
      }

      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }

      // Update user status to online
      await User.findByIdAndUpdate(user._id, { status: 'online' });

      const token = generateToken(user);
      
      return {
        success: true,
        message: 'Login successful!',
        user: user.toJSON() as IUser,
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  static async signup(userData: SignupData): Promise<AuthResponse> {
    try {
      await connectToDatabase();

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return { success: false, message: 'Email already registered. Please use a different email.' };
      }

      // Create new user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'citizen',
        status: 'online',
      });

      await user.save();

      const token = generateToken(user);

      return {
        success: true,
        message: 'Account created successfully!',
        user: user.toJSON() as IUser,
        token,
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 11000) { // MongoDB duplicate key error
        return { success: false, message: 'Email already registered. Please use a different email.' };
      }
      
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    try {
      await connectToDatabase();
      return await User.findById(userId);
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  static async updateUserStatus(userId: string, status: 'online' | 'offline'): Promise<boolean> {
    try {
      await connectToDatabase();
      await User.findByIdAndUpdate(userId, { status });
      return true;
    } catch (error) {
      console.error('Update user status error:', error);
      return false;
    }
  }
}