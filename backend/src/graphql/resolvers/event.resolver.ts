import { PrismaClient } from "@prisma/client";
import { getIO } from "../../socket/socket";
const prisma = new PrismaClient();

export const eventResolvers = {
  Query: {
    getEvents: () =>
      prisma.event.findMany({
        include: { attendees: true },
      }),
    getEventById: async (_: any, { id }: any) => {
      return await prisma.event.findUnique({
        where: { id },
        include: {
          attendees: true,
          creator: true,
        },
      });
    },
  },
  Mutation: {
    createEvent: async (
      _: any,
      { title, description, startTime }: any,
      ctx: any
    ) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const newEvent = await ctx.prisma.event.create({
        data: {
          title,
          description,
          startTime,
          creator: { connect: { id: ctx.userId } },
          attendees: {
            connect: { id: ctx.userId },
          },
        },
        include: {
          attendees: true,
          creator: true,
        },
      });

      const io = getIO();
      io.emit("newEventCreated", newEvent); 

      return newEvent;
    },

    joinEvent: async (_: any, { eventId }: any, ctx: any) => {
      if (!ctx.userId) throw new Error("Not authenticated");
      console.log("User joining:", ctx.userId, "Event:", eventId);

      const event = await ctx.prisma.event.findUnique({
        where: { id: eventId },
        include: { attendees: true },
      });
      if (!event) throw new Error("Event not found");

      const alreadyJoined = event.attendees.some(
        (a: { id: string }) => a.id === ctx.userId
      );
      if (alreadyJoined) return event;

      const updatedEvent = await ctx.prisma.event.update({
        where: { id: eventId },
        data: {
          attendees: {
            connect: { id: ctx.userId },
          },
        },
        include: {
          attendees: true,
        },
      });

      const io = getIO();
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, name: true },
      });
      io.emit("userJoinedEvent", {
        eventId,
        user,
      });

      return updatedEvent;
    },

    leaveEvent: async (_: any, { eventId }: any, ctx: any) => {
      if (!ctx.userId) throw new Error("Not authenticated");

      const event = await ctx.prisma.event.findUnique({
        where: { id: eventId },
        include: { attendees: true },
      });
      if (!event) throw new Error("Event not found");

      const isAttending = event.attendees.some(
        (a: { id: string }) => a.id === ctx.userId
      );
      if (!isAttending) return event;

      const updatedEvent = await ctx.prisma.event.update({
        where: { id: eventId },
        data: {
          attendees: {
            disconnect: { id: ctx.userId },
          },
        },
        include: {
          attendees: true,
        },
      });

      const io = getIO();
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { id: true, name: true },
      });
      console.log("📤 Emitting userLeftEvent", { eventId, user });
      io.emit("userLeftEvent", {
        eventId,
        user,
      });

      return updatedEvent;
    },

    cancelEvent: async (_: any, { eventId }: any, ctx: any) => {
      const event = await ctx.prisma.event.findUnique({
        where: { id: eventId },
      });
      if (!event) throw new Error("Event not found");
      if (event.creatorId !== ctx.userId) throw new Error("Not authorized");

      await ctx.prisma.event.delete({ where: { id: eventId } });

      const io = getIO();
      console.log("Emitting socket event: eventCancelled", eventId);
      io.emit("eventCancelled", { eventId });
      console.log("Event cancelled and socket event emitted");

      return true;
    },
  },
};
