import type { Session } from "@auth/qwik";

export type Bindings = Env & {
  session: Session | null;
};
