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
