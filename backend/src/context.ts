// src/context.ts
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

export const createContext = ({ req }: { req: any }) => {
  const auth = req.headers.authorization || "";
  let userId = null;

  if (auth.startsWith("Bearer ")) {
    try {
      const token = auth.replace("Bearer ", "");
      const decoded = jwt.verify(token, SECRET) as any;
      userId = decoded.userId;
      console.log("👤 Authenticated userId:", userId);
    } catch (err) {
      console.warn("Invalid JWT token");
    }
  }

  return { prisma, userId };
};
