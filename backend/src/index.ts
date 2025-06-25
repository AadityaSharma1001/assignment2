import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import { schema } from "./graphql/schema";
import { createContext } from "./context";
import http from "http";
import { initSocket } from "./socket/socket";

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = process.env.PORT || 4000;

  const io = initSocket(httpServer);
  app.set("io", io);

  const server = new ApolloServer({
    schema,
  });

  await server.start();

  // Middlewares
  app.use(cors());
  app.use(express.json());

  // Debug request logger
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
  });

  // GraphQL endpoint
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => createContext({ req }),
    })
  );

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer();
