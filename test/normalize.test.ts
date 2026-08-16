import { describe, expect, it } from "vitest";
import { allPartsKey, normalizeCode, normKey, undatedKey } from "../src/lib/normalize";

describe("normalizeCode", () => {
  it("collapses em/en dashes and unicode whitespace", () => {
    expect(normalizeCode("ISO 19115—1")).toBe("ISO 19115-1");
    expect(normalizeCode("ISO 19115–1")).toBe("ISO 19115-1");
    expect(normalizeCode("ISO 19115–1")).toBe("ISO 19115-1");
    expect(normalizeCode("ISO　19115—1")).toBe("ISO 19115-1");
    expect(normalizeCode("  ISO   19115-1  ")).toBe("ISO 19115-1");
  });

  it("unwraps scope wrappers", () => {
    expect(normalizeCode("IEC(IEC 31010)")).toBe("IEC 31010");
    expect(normalizeCode("CN(GM/T 0009-2012)")).toBe("GM/T 0009-2012");
    expect(normalizeCode("ISO(ISO 639-1)")).toBe("ISO 639-1");
  });

  it("leaves mid-string parens alone", () => {
    expect(normalizeCode("ITU-T G.7710/Y.1705 (2001)")).toBe("ITU-T G.7710/Y.1705 (2001)");
  });
});

describe("normKey", () => {
  it("uppercases and removes spaces", () => {
    expect(normKey("iec 31010:2019")).toBe("IEC31010:2019");
    expect(normKey("ISO 19115-1:2014")).toBe("ISO19115-1:2014");
  });
});

describe("undatedKey / allPartsKey", () => {
  it("strips trailing years", () => {
    expect(undatedKey("ISO19115-1:2014")).toBe("ISO19115-1");
    expect(undatedKey("IEC31010")).toBe("IEC31010");
  });

  it("strips parenthesised years (ITU style)", () => {
    expect(undatedKey("G.7710/Y.1705(2001)")).toBe("G.7710/Y.1705");
    expect(undatedKey("G.7710(2001)")).toBe("G.7710");
    expect(undatedKey("IEC31010:2019(E)")).toBe("IEC31010(E)");
  });

  it("strips trailing part for all-parts keys", () => {
    expect(allPartsKey("ISO19115-1:2014")).toBe("ISO19115");
    expect(allPartsKey("ISO53798-2")).toBe("ISO53798");
    expect(allPartsKey("ISO19115")).toBe("ISO19115");
  });
});
