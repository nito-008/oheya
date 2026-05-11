import type { Bindings } from "~/hono/types";

export type UsersEnv = {
  Bindings: Bindings;
  Variables: { userId: string };
};
