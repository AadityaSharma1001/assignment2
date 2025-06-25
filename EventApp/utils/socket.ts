// socket.ts
import { io, Socket } from "socket.io-client";

// We can read this from an environment variable or config file in a real app
// For now, hardcoding the URL for simplicity

const URL = "http://192.168.135.110:4000/"; // Ensure this IP is accessible from your phone/device

export const socket: Socket = io(URL, {
  transports: ["websocket"], // recommended for React Native
  autoConnect: true,
});
