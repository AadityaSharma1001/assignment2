import { eventTypeDefs } from './event.typeDefs';
import { userTypeDefs } from './user.typeDefs';
import { authTypeDefs } from './auth.typeDefs';

export const rootTypeDefs = `
  type Query
  type Mutation
`;

export const typeDefs = [
  rootTypeDefs,
  userTypeDefs,
  eventTypeDefs,
  authTypeDefs,
];
