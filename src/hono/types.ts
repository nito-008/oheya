import type { Session } from "@auth/qwik";

export type Bindings = {
  env: Env;
  session: Session | null;
};
