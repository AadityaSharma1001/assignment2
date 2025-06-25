export const eventTypeDefs = `
  type User {
    id: ID!
    name: String!
  }

  type Event {
  id: ID!
  title: String!
  description: String!
  startTime: String!
  attendees: [User!]!
  creator: User!
}

  type Query {
    getEvents: [Event!]!
    getEventById(id: String!): Event
  }

  type Mutation {
    createEvent(title: String!, description: String!, startTime: String!): Event!
    joinEvent(eventId: String!): Event!         
    leaveEvent(eventId: String!): Event!
    cancelEvent(eventId: String!): Boolean!
  }
`;
