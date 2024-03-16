// Connect to localhost on port 6379.

import { createClient } from "redis";

export const client = createClient();

export const connectClient = async () => {
  client.on("error", (err) => console.log("Redis Client Error", err));
  const isConnected = await client.connect();
  return isConnected;
};
