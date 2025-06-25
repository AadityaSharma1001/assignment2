import { eventResolvers } from './event.resolver';
import { userResolvers } from './user.resolver';
import { authResolvers } from './auth.resolver';
import { mergeResolvers } from '@graphql-tools/merge';

export const resolvers = mergeResolvers([userResolvers, eventResolvers, authResolvers]);
