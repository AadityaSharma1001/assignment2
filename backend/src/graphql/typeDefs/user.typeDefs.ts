export const userTypeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    events: [Event!]!
  }

  type Query {
    getUsers: [User!]!
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }
`;