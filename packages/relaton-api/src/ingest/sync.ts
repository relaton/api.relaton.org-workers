import type { Env } from "../env";

export async function runIngestion(env: Env): Promise<void> {
  const { results } = await env.DB.prepare(
    "SELECT flavor, doc_count FROM flavors ORDER BY flavor",
  ).all();
  console.log(`ingest tick: ${JSON.stringify(results ?? [])}`);
}
