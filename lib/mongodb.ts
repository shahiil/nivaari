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

export type UserRole = "citizen";

export interface UserDocument {
  _id?: ObjectId;
  name?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status?: "online" | "offline";
  phone?: string;
  profilePhoto?: string;
  createdAt: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
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


export async function getCitizenReportsCollection(): Promise<Collection<CitizenReportDocument>> {
  const db = await getDb();
  const collection = db.collection<CitizenReportDocument>('citizenReports');
  await collection.createIndex({ createdAt: 1 });
  await collection.createIndex({ city: 1 });
  return collection;
}

