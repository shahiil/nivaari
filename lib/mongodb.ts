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

export type UserRole = "citizen" | "admin" | "supervisor";

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
