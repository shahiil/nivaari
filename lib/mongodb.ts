import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const dbName = process.env.MONGODB_DB || "nivaari";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export type UserRole = "citizen" | "admin" | "moderator";

export interface UserDocument {
  _id?: ObjectId;
  name?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: "online" | "offline";
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
}

export interface InviteDocument {
  _id?: ObjectId;
  token: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
}

// Citizen report submitted by users
export interface CitizenReportDocument {
  _id?: ObjectId;
  title: string;
  type: string; // category/type string
  category?: string; // optional normalized category
  description: string;
  city?: string;
  status?: 'submitted' | 'withdrawn';
  location?: { lat?: number; lng?: number; address?: string };
  imageUrl?: string | null;
  createdByUserId?: ObjectId | null;
  createdAt: Date;
  updatedAt?: Date;
}

// Moderator review results for a citizen report
export interface ModeratorReportDocument {
  _id?: ObjectId;
  citizenReportId: ObjectId;
  status: 'approved' | 'rejected';
  moderatorUserId: ObjectId;
  decidedAt: Date;
  // snapshot for faster reads on citizen dashboard
  title: string;
  type: string;
  city?: string;
  location?: { lat?: number; lng?: number; address?: string };
}

// Moderators metadata
export interface ModeratorDocument {
  _id?: ObjectId;
  userId: ObjectId; // reference to users collection
  email: string;
  mobile?: string;
  status?: 'online' | 'offline';
  createdAt: Date;
  updatedAt?: Date;
}

// Invite tokens for moderator registration
export interface InviteTokenDocument {
  _id?: ObjectId;
  token: string;
  type: 'email' | 'sms';
  email?: string;
  phone?: string;
  role: 'moderator';
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
}

export async function getDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDb();
  const collection = db.collection<UserDocument>("users");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
}

export async function getInvitesCollection(): Promise<Collection<InviteDocument>> {
  const db = await getDb();
  const collection = db.collection<InviteDocument>("adminInvites");
  await collection.createIndex({ token: 1 }, { unique: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return collection;
}

export async function getCitizenReportsCollection(): Promise<Collection<CitizenReportDocument>> {
  const db = await getDb();
  const collection = db.collection<CitizenReportDocument>('citizenReports');
  await collection.createIndex({ createdAt: 1 });
  await collection.createIndex({ city: 1 });
  return collection;
}

export async function getModeratorReportsCollection(): Promise<Collection<ModeratorReportDocument>> {
  const db = await getDb();
  const collection = db.collection<ModeratorReportDocument>('moderatorReports');
  await collection.createIndex({ status: 1, decidedAt: -1 });
  await collection.createIndex({ citizenReportId: 1 }, { unique: true });
  return collection;
}

export async function getModeratorsCollection(): Promise<Collection<ModeratorDocument>> {
  const db = await getDb();
  const collection = db.collection<ModeratorDocument>('moderators');
  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ userId: 1 }, { unique: true });
  return collection;
}

export async function getInviteTokensCollection(): Promise<Collection<InviteTokenDocument>> {
  const db = await getDb();
  const collection = db.collection<InviteTokenDocument>('inviteTokens');
  await collection.createIndex({ token: 1 }, { unique: true });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  return collection;
}
