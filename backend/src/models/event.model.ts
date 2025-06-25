// event.model.ts
// ✅ Prisma DB utility functions for event operations (currently not used directly in resolvers)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all events with their attendees and creator info
export const getAllEvents = async () => {
  return prisma.event.findMany({
    include: {
      attendees: true,
      creator: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
};

// Get a single event by ID with full details
export const getEventById = async (id: string) => {
  return prisma.event.findUnique({
    where: { id },
    include: {
      attendees: true,
      creator: true,
    },
  });
};

// Create a new event with title, description, time, and creator
export const createEvent = async (
  title: string,
  description: string,
  startTime: Date,
  creatorId: string
) => {
  return prisma.event.create({
    data: {
      title,
      description,
      startTime,
      creator: {
        connect: { id: creatorId },
      },
    },
    include: {
      attendees: true,
      creator: true,
    },
  });
};

// Add user to event's attendees
export const joinEvent = async (eventId: string, userId: string) => {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      attendees: {
        connect: { id: userId },
      },
    },
    include: {
      attendees: true,
    },
  });
};

// Remove user from event's attendees
export const leaveEvent = async (eventId: string, userId: string) => {
  return prisma.event.update({
    where: { id: eventId },
    data: {
      attendees: {
        disconnect: { id: userId },
      },
    },
    include: {
      attendees: true,
    },
  });
};

// Cancel event (deletes it)
export const cancelEvent = async (eventId: string) => {
  return prisma.event.delete({
    where: { id: eventId },
  });
};
