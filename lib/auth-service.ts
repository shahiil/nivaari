import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import {
  getUsersCollection,
  UserDocument,
  UserRole,
} from "@/lib/mongodb";

export type PublicUser = {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  status?: "online" | "offline";
  createdAt?: string;
  lastLoginAt?: string;
};

function mapUser(doc: UserDocument): PublicUser {
  return {
    id: doc._id ? doc._id.toString() : "",
    name: doc.name,
    email: doc.email,
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt?.toISOString?.() ?? undefined,
    lastLoginAt: doc.lastLoginAt?.toISOString?.() ?? undefined,
  };
}

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (saltError, salt) => {
      if (saltError) {
        reject(saltError);
        return;
      }

      bcrypt.hash(password, salt, (hashError, hashed) => {
        if (hashError) {
          reject(hashError);
          return;
        }

        resolve(hashed);
      });
    });
  });
}

function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hashedPassword, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
  });
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const users = await getUsersCollection();
  return users.findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  const users = await getUsersCollection();
  return users.findOne({ _id: new ObjectId(id) });
}

interface CreateUserParams {
  name?: string;
  email: string;
  password: string;
  role: UserRole;
  status?: "online" | "offline";
}

export async function createUser(params: CreateUserParams): Promise<PublicUser> {
  const users = await getUsersCollection();
  const passwordHash = await hashPassword(params.password);

  const now = new Date();
  const result = await users.insertOne({
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash,
    role: params.role,
    status: params.status ?? "offline",
    createdAt: now,
    updatedAt: now,
  });

  const createdUser: UserDocument = {
    _id: result.insertedId,
    name: params.name,
    email: params.email.toLowerCase(),
    passwordHash,
    role: params.role,
    status: params.status ?? "offline",
    createdAt: now,
    updatedAt: now,
  };

  return mapUser(createdUser);
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<UserDocument | null> {
  const user = await findUserByEmail(email);
  if (!user) {
    return null;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function updateUserStatus(
  userId: string,
  status: "online" | "offline"
): Promise<void> {
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        status,
        updatedAt: new Date(),
        ...(status === "online" ? { lastLoginAt: new Date() } : {}),
      },
    }
  );
}

export { mapUser };

// --- Default admin seeding (for initial bootstrap) ---
let adminSeedPromise: Promise<void> | null = null;

const DEFAULT_ADMIN = {
  name: "Shahiil Shet",
  email: "shahiilshet@gmail.com",
  password: "shahiil@142",
} as const;

export async function ensureDefaultAdmin(): Promise<void> {
  if (adminSeedPromise) return adminSeedPromise;

  adminSeedPromise = (async () => {
    const users = await getUsersCollection();
    const existing = await users.findOne({ email: DEFAULT_ADMIN.email.toLowerCase() });
    if (existing) return;

    const passwordHash = await hashPassword(DEFAULT_ADMIN.password);
    const now = new Date();
    await users.insertOne({
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email.toLowerCase(),
      passwordHash,
      role: "admin" as UserRole,
      status: "offline",
      createdAt: now,
      updatedAt: now,
      lastLoginAt: undefined,
    } satisfies UserDocument);
  })();

  return adminSeedPromise;
}
