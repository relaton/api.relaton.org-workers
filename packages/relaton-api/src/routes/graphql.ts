import { createSchema, createYoga } from "graphql-yoga";
import type { Context, Handler } from "hono";
import type { AppEnv, Env } from "../env";
import { findDocument, type DocumentRow } from "../lib/lookup";
import { normKey } from "../lib/normalize";

const typeDefs = /* GraphQL */ `
  type Query {
    document(code: String!, year: Int, allParts: Boolean): Document
    documents(
      code: String
      flavor: String
      title: String
      year: Int
      doctype: String
      after: String
      first: Int = 20
    ): DocumentConnection!
    flavors: [Flavor!]!
    version: Version!
  }

  type Document {
    id: Int!
    flavor: String!
    filePath: String!
    docid: String
    identifiers: [DocIdentifier!]!
    year: Int
    published: String
    title: String
    doctype: String
    status: String
    xml: String
  }

  type DocIdentifier {
    raw: String!
    type: String
  }

  type Flavor {
    flavor: String!
    repo: String!
    docCount: Int!
    lastModified: String
    ingestedAt: String!
  }

  type Version {
    release: String!
    relaton: String!
  }

  type DocumentConnection {
    edges: [DocumentEdge!]!
    pageInfo: PageInfo!
  }

  type DocumentEdge {
    node: Document!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }
`;

interface SearchArgs {
  code?: string | null;
  flavor?: string | null;
  title?: string | null;
  year?: number | null;
  doctype?: string | null;
  after?: string | null;
  first?: number | null;
}

function encodeCursor(id: number): string {
  return btoa(String(id));
}

function decodeCursor(cursor: string): number | null {
  const n = Number(atob(cursor));
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

async function searchDocuments(db: D1Database, args: SearchArgs) {
  const conditions: string[] = [];
  const binds: (string | number)[] = [];

  if (args.code) {
    const k = normKey(args.code);
    conditions.push(
      `(d.norm = ? OR d.undated_norm = ? OR EXISTS (SELECT 1 FROM docids AS i WHERE i.document_id = d.id AND (i.norm = ? OR i.norm LIKE ?)))`,
    );
    binds.push(k, k, k, `${k}:%`);
  }
  if (args.flavor) {
    conditions.push("d.flavor = ?");
    binds.push(args.flavor);
  }
  if (args.title) {
    conditions.push("d.title_en LIKE ?");
    binds.push(`%${args.title}%`);
  }
  if (args.year) {
    conditions.push("d.year = ?");
    binds.push(args.year);
  }
  if (args.doctype) {
    conditions.push("d.doctype = ?");
    binds.push(args.doctype);
  }
  if (args.after) {
    const afterId = decodeCursor(args.after);
    if (afterId === null) throw new Error("Invalid cursor.");
    conditions.push("d.id > ?");
    binds.push(afterId);
  }

  const first = Math.min(Math.max(args.first ?? 20, 1), 100);
  binds.push(first + 1);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { results } = await db
    .prepare(`SELECT d.* FROM documents AS d ${where} ORDER BY d.id ASC LIMIT ?`)
    .bind(...binds)
    .all<DocumentRow>();

  const rows = results ?? [];
  const hasNextPage = rows.length > first;
  const edges = rows.slice(0, first).map((row) => ({
    node: row,
    cursor: encodeCursor(row.id),
  }));

  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.length ? edges[edges.length - 1]?.cursor : null,
    },
  };
}

interface GqlContext {
  env: Env;
}

const resolvers = {
  Query: {
    document: (_p: unknown, args: { code: string; year?: number | null; allParts?: boolean | null }, ctx: GqlContext) =>
      findDocument(ctx.env.DB, args),

    documents: (_p: unknown, args: SearchArgs, ctx: GqlContext) =>
      searchDocuments(ctx.env.DB, args),

    flavors: async (_p: unknown, _a: unknown, ctx: GqlContext) => {
      const { results } = await ctx.env.DB.prepare(
        `SELECT d.flavor,
                COUNT(*) AS docCount,
                MAX(f.ingested_at) AS ingestedAt,
                MIN(f.repo) AS repo
         FROM documents AS d LEFT JOIN flavors AS f ON f.flavor = d.flavor
         GROUP BY d.flavor ORDER BY d.flavor`,
      ).all();
      return results ?? [];
    },

    version: async (_p: unknown, _a: unknown, ctx: GqlContext) => {
      const row = await ctx.env.DB.prepare(
        "SELECT value FROM meta WHERE key = 'relaton_version'",
      ).first<{ value: string }>();
      return { release: ctx.env.API_VERSION ?? "dev", relaton: row?.value ?? "data-repos" };
    },
  },
  Document: {
    title: (doc: DocumentRow) => doc.title_en,
    identifiers: async (doc: DocumentRow, _a: unknown, ctx: GqlContext) => {
      const { results } = await ctx.env.DB.prepare(
        "SELECT raw, type FROM docids WHERE document_id = ?1",
      )
        .bind(doc.id)
        .all<{ raw: string; type: string | null }>();
      return results ?? [];
    },
    xml: async (doc: DocumentRow, _a: unknown, ctx: GqlContext) => {
      const obj = await ctx.env.BUCKET.get(doc.r2_key);
      return obj ? await obj.text() : null;
    },
  },
};

export function graphqlRoute(): Handler<AppEnv> {
  const yoga = createYoga<{ env: Env }>({
    schema: createSchema({ typeDefs, resolvers }),
    graphqlEndpoint: "/graphql",
  });
  return (c: Context<AppEnv>) => yoga(c.req.raw, { env: c.env });
}
