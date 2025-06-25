import { getAllUsers } from '../../models/user.model';

export const userResolvers = {
  Query: {
    getUsers: async () => await getAllUsers(),
  },
};
