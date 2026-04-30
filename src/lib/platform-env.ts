type EventWithPlatformEnv = {
  platform?: {
    env?: Env;
  };
};

type PreviewPlatform = {
  env: Env;
};

declare global {
  // Populated by vite.config.ts for local dev/preview where Node middleware
  // does not hydrate event.platform.env.
  var __OHEYA_PLATFORM__: PreviewPlatform | undefined;
}

export function getPlatformEnv(event: EventWithPlatformEnv): Env {
  const env = event.platform?.env ?? globalThis.__OHEYA_PLATFORM__?.env;
  if (!env) {
    throw new Error("platform.env is unavailable");
  }
  return env;
}
