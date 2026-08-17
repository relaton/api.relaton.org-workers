import { z } from "zod";

export const RelatonApiConfigSchema = z.object({
  name: z.string().default("relaton-api"),
  cache: z.object({ edge: z.boolean().default(true) }).prefault({}),
  paths: z
    .object({
      graphql: z.string().default("/graphql"),
      openapi: z.string().default("/openapi.json"),
      docs: z.string().default("/docs"),
    })
    .prefault({}),
});

export type RelatonApiConfig = z.output<typeof RelatonApiConfigSchema>;

export function parseConfig(input: unknown): RelatonApiConfig {
  return RelatonApiConfigSchema.parse(input ?? {});
}
