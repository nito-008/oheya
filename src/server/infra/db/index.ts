import type { Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const getDb = (client: Client) => drizzle(client, { schema });

export { schema };
