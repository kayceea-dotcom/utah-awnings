import { describe, it, expect } from "vitest";
import { INSTALL_CHECKLIST, checklistComplete, checklistDoneCount } from "./installChecklist";

describe("install checklist", () => {
  it("has unique keys", () => {
    expect(new Set(INSTALL_CHECKLIST.map((i) => i.key)).size).toBe(INSTALL_CHECKLIST.length);
  });

  it("is only complete when every item is checked", () => {
    const all = Object.fromEntries(INSTALL_CHECKLIST.map((i) => [i.key, true]));
    expect(checklistComplete(all)).toBe(true);
    expect(checklistComplete({ ...all, [INSTALL_CHECKLIST[0].key]: false })).toBe(false);
    expect(checklistComplete({})).toBe(false);
    expect(checklistComplete(null)).toBe(false);
  });

  it("counts checked items", () => {
    expect(checklistDoneCount({ [INSTALL_CHECKLIST[0].key]: true, [INSTALL_CHECKLIST[1].key]: true })).toBe(2);
    expect(checklistDoneCount(undefined)).toBe(0);
  });
});
