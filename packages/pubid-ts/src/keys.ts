const SCOPE_WRAPPER = /^([A-Za-z0-9]{1,8})\((.+)\)$/;

export function normalizeCode(input: string): string {
  return input
    .replace(/[—–]/g, "-")
    .replace(/[\p{Z} ]+/gu, " ")
    .trim()
    .replace(SCOPE_WRAPPER, (_m, _scope: string, inner: string) => inner);
}

export function normKey(input: string): string {
  return normalizeCode(input).toUpperCase().replace(/\s+/g, "");
}

// "ISO/IEC 31010" → "IEC31010" (primary publisher is the last segment)
export function lastPublisherKey(norm: string): string {
  return norm.replace(/^(?:[A-Z]{2,10}\/)+/, "");
}

const TRAILING_YEAR = /:(\d{4})(?=[^-]*$)/;
const PARENS_YEAR = /\((?:19|20)\d{2}\)$/;
const TRAILING_PART = /-\d+[A-Z]?$/;

export function undatedKey(norm: string): string {
  return norm.replace(TRAILING_YEAR, "").replace(PARENS_YEAR, "");
}

export function allPartsKey(norm: string): string {
  return undatedKey(norm).replace(TRAILING_PART, "");
}

import { parse } from "./index";

export interface DerivedKeys {
  norm: string;
  undated: string;
  allparts: string;
  canonical: string;
}

// Single home for lookup-key derivation. Semantics come from the pubid
// parse (year/part are structural values); parity with pubid ruby is
// enforced by the golden corpus (tools/gen_corpus.rb).
export function deriveKeys(code: string, flavor?: string): DerivedKeys {
  const id = parse(code, flavor);
  const canonical = id?.canonical ?? normalizeCode(code);
  const norm = normKey(canonical);
  const year = id?.year;
  const undated = year ? norm.replace(new RegExp(`:?${year}(?=[^-]*$)`), "") : undatedKey(norm);
  const part = (id as { part?: string } | null)?.part;
  const allparts = part ? undated.replace(new RegExp(`-${part}(?=[^-]*$)`), "") : allPartsKey(norm);
  return { norm, undated, allparts, canonical };
}
