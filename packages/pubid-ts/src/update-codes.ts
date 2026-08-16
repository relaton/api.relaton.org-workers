import bipm from "../data/update-codes/bipm.json";
import ccsds from "../data/update-codes/ccsds.json";
import iec from "../data/update-codes/iec.json";
import ieee from "../data/update-codes/ieee.json";
import iso from "../data/update-codes/iso.json";
import nist from "../data/update-codes/nist.json";
import plateau from "../data/update-codes/plateau.json";

type Rule = [string, string];

const RULES: Record<string, Rule[]> = {
  bipm: bipm as Rule[],
  ccsds: ccsds as Rule[],
  iec: iec as Rule[],
  ieee: ieee as Rule[],
  iso: iso as Rule[],
  nist: nist as Rule[],
  plateau: plateau as Rule[],
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Mirrors pubid's Core::UpdateCodes: plain keys anchor to the full string,
// "/body/flags" keys compile with flags (Ruby m == JS s).
function compile(from: string): RegExp {
  const m = from.match(/^\/(.*)\/([imx]*)$/s);
  if (!m?.[1]) return new RegExp(`^${escapeRe(from)}$`, "g");
  let flags = "g";
  if (m[2]?.includes("i")) flags += "i";
  if (m[2]?.includes("m")) flags += "s";
  const body = m[1].replace(/\\A/g, "^").replace(/\\z/g, "$");
  return new RegExp(body, flags);
}

export function applyUpdateCodes(code: string, flavor: string): string {
  const rules = RULES[flavor];
  if (!rules) return code;
  let out = code;
  for (const [from, to] of rules) out = out.replace(compile(from), to);
  return out;
}
