import { MongoClient, Db, Collection, ObjectId } from "mongodb";

const dbName = process.env.MONGODB_DB || "nivaari";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function isSrvLookupError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; syscall?: unknown };
  return maybeError.code === "ECONNREFUSED" && maybeError.syscall === "querySrv";
}

function createClientPromise(uri: string): Promise<MongoClient> {
  const nextClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });

  client = nextClient;
  return nextClient.connect();
}

function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  const connectWithFallback = async (): Promise<MongoClient> => {
    try {
      return await createClientPromise(uri);
    } catch (error) {
      if (fallbackUri && isSrvLookupError(error)) {
        console.warn("MongoDB SRV DNS lookup failed, retrying with MONGODB_URI_FALLBACK.");
        return createClientPromise(fallbackUri);
      }
      throw error;
    }
  };

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connectWithFallback().catch((error) => {
        global._mongoClientPromise = undefined;
        client = null;
        throw error;
      });
    }
    return global._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = connectWithFallback().catch((error) => {
      clientPromise = null;
      client = null;
      throw error;
    });
  }

  return clientPromise;
}

export type UserRole = "citizen";

export interface UserDocument {
  _id?: ObjectId;
  name?: string;
  email: string;
  passwordHash: string;
  authProvider?: "email" | "anonymous";
  socialId?: string;
  recoveryKeyHash?: string;
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
  impactRadiusKm?: number;
  aiSummary?: string;
  verificationQuestions?: string[];
  chatHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  imageUrl?: string | null;
  image?: string;
  votes?: Array<{ socialId: string; vote: 'upvote' | 'downvote'; votedAt: Date }>;
  createdByUserId?: ObjectId | null;
  createdBySocialId?: string | null;
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
  await collection.createIndex({ socialId: 1 }, { unique: true, sparse: true });
  return collection;
}


export async function getCitizenReportsCollection(): Promise<Collection<CitizenReportDocument>> {
  const db = await getDb();
  const collection = db.collection<CitizenReportDocument>('reports');
  await collection.createIndex({ createdAt: 1 });
  await collection.createIndex({ city: 1 });
  await collection.createIndex({ "location.lat": 1, "location.lng": 1 });
  await collection.createIndex({ type: 1 });
  await collection.createIndex({ createdBySocialId: 1 });
  return collection;
}

export async function getReportsCollection(): Promise<Collection<CitizenReportDocument>> {
  return getCitizenReportsCollection();
}

