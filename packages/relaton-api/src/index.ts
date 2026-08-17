import { createApp } from "./app";
import { parseConfig, type RelatonApiConfig } from "./config";

export { createApp } from "./app";
export { parseConfig, RelatonApiConfigSchema } from "./config";
export type { RelatonApiConfig } from "./config";
export type { AppEnv, Env } from "./env";
export { runIngestion } from "./ingest/sync";
export { normalizeCode, normKey, undatedKey, allPartsKey, lastPublisherKey } from "./lib/normalize";

export interface RelatonApi {
  app: ReturnType<typeof createApp>;
  config: RelatonApiConfig;
}

export function createRelatonApi(configInput: unknown = {}): RelatonApi {
  const config = parseConfig(configInput);
  return { app: createApp(config), config };
}
