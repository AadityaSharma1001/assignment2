import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { Slot } from "expo-router";
import { useAuthStore } from "../store/authStore";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const httpLink = createHttpLink({
  uri: "http://192.168.135.110:4000/graphql", // ✅ your backend
});

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <ApolloProvider client={apolloClient}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </ApolloProvider>
  );
}
