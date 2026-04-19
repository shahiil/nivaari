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
  socialId?: string;
  role: UserRole;
  status?: "online" | "offline";
  phone?: string;
  profilePhoto?: string;
  createdAt?: string;
  lastLoginAt?: string;
};

function mapUser(doc: UserDocument): PublicUser {
  return {
    id: doc._id ? doc._id.toString() : "",
    name: doc.name,
    email: doc.email,
    socialId: doc.socialId,
    role: doc.role,
    status: doc.status,
    phone: doc.phone,
    profilePhoto: doc.profilePhoto,
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

export async function findUserBySocialId(socialId: string): Promise<UserDocument | null> {
  const users = await getUsersCollection();
  return users.findOne({ socialId: socialId.toUpperCase() });
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
    authProvider: "email",
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
    authProvider: "email",
    role: params.role,
    status: params.status ?? "offline",
    createdAt: now,
    updatedAt: now,
  };

  return mapUser(createdUser);
}

function generateSocialId(): string {
  return `NIV-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}

function generateRecoveryKey(): string {
  return Array.from({ length: 4 })
    .map(() => Math.random().toString(36).slice(2, 6).toUpperCase())
    .join("-");
}

export async function createAnonymousUser(): Promise<{ user: PublicUser; recoveryKey: string }> {
  const users = await getUsersCollection();

  let socialId = generateSocialId();
  for (let tries = 0; tries < 5; tries += 1) {
    const existing = await findUserBySocialId(socialId);
    if (!existing) break;
    socialId = generateSocialId();
  }

  const recoveryKey = generateRecoveryKey();
  const recoveryKeyHash = await hashPassword(recoveryKey);
  const passwordHash = await hashPassword(`${socialId}:${Date.now()}`);
  const syntheticEmail = `${socialId.toLowerCase()}@anonymous.nivaari.local`;
  const now = new Date();

  const result = await users.insertOne({
    name: `Anonymous ${socialId.slice(-4)}`,
    email: syntheticEmail,
    passwordHash,
    authProvider: "anonymous",
    socialId,
    recoveryKeyHash,
    role: "citizen",
    status: "offline",
    createdAt: now,
    updatedAt: now,
  });

  const createdUser: UserDocument = {
    _id: result.insertedId,
    name: `Anonymous ${socialId.slice(-4)}`,
    email: syntheticEmail,
    passwordHash,
    authProvider: "anonymous",
    socialId,
    recoveryKeyHash,
    role: "citizen",
    status: "offline",
    createdAt: now,
    updatedAt: now,
  };

  return {
    user: mapUser(createdUser),
    recoveryKey,
  };
}

export async function verifyAnonymousCredentials(
  socialId: string,
  recoveryKey: string
): Promise<UserDocument | null> {
  const user = await findUserBySocialId(socialId.toUpperCase());
  if (!user?.recoveryKeyHash) {
    return null;
  }

  const isValid = await comparePassword(recoveryKey, user.recoveryKeyHash);
  if (!isValid) {
    return null;
  }

  return user;
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

