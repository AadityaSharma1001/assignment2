// src/graphql/resolvers/authResolvers.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

export const authResolvers = {
  Mutation: {
    signup: async (_: any, { name, email, password }: any) => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new Error("User already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword },
      });

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" });
      return { token, user };
    },

    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error("User not found");

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new Error("Invalid password");

      const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" });
      return { token, user };
    },
  },

  Query: {
    me: async (_: any, __: any, context: any) => {
      const { userId } = context;
      if (!userId) throw new Error("Not authenticated");

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");
      return user;
    },
  },
};
