import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import clientPromise from "./mongodb";

const userLabels = [
  "Парковка",
  "Без собак",
  "Не ходить",
  "Общественное место",
  "Пешеходная зона",
  "Мусорная площадка",
  "Своя Зона-1",
  "Своя Зона-2",
  "Своя Зона-3",
  "Своя Зона-4",
];

export async function createUser({ username, password }) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  const user = {
    id: uuidv4(),
    createdAt: Date.now(),
    username,
    hash,
    salt,
    userLabels
  };

  const db = (await clientPromise).db();
  if (!(await findUser({ username }))) {
    await db.collection("users").insertOne(user);
    return { username, createdAt: Date.now() };
  } else {
    throw new Error("Username занят");
  }
}

export async function findUser({ username }) {
  const db = (await clientPromise).db();
  return db.collection("users").findOne({ username });
}

export function validatePassword(user, inputPassword) {
  const inputHash = crypto
    .pbkdf2Sync(inputPassword, user.salt, 1000, 64, "sha512")
    .toString("hex");
  return user.hash === inputHash;
}
