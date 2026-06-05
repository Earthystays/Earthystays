import { randomBytes } from "crypto";
import { readJson, writeJson } from "@/lib/storage";

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  wishlist: string[];
  createdAt: string;
};

const FILE = "users.json";

export async function getUsers(): Promise<User[]> {
  return readJson<User[]>(FILE, []);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  const lc = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === lc);
}

export async function findUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.id === id);
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  const users = await getUsers();
  const user: User = {
    id: `usr_${Date.now()}_${randomBytes(4).toString("hex")}`,
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: input.passwordHash,
    wishlist: [],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await writeJson(FILE, users);
  return user;
}

export async function setWishlist(userId: string, mutator: (current: string[]) => string[]): Promise<string[]> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw new Error("User not found");
  users[idx].wishlist = mutator(users[idx].wishlist);
  await writeJson(FILE, users);
  return users[idx].wishlist;
}
