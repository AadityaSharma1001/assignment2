// user.model.ts
// ✅ Prisma DB utility functions for user operations (currently not used directly in resolvers)

import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();

// Fetch all users with their created and joined events
export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany({
    include: {
      events: true,           // Events they are attending
      createdEvents: true,    // Events they have created (if model has relation name)
    },
  });
};

// Get one user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      events: true,
      createdEvents: true,
    },
  });
};

// Create new user (for signup, or social login logic)
export const createUser = async (
  name: string,
  email: string,
  password: string
): Promise<User> => {
  return prisma.user.create({
    data: {
      name,
      email,
      password,
    },
  });
};
