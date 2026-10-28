// The finished-job checklist every installer works through. Keys are what's
// stored on the quote (quotes.install_checklist), so don't rename an existing
// key - change the label instead.
export const INSTALL_CHECKLIST: { key: string; label: string }[] = [
  { key: "posts",       label: "Posts set plumb and anchored securely" },
  { key: "beams",       label: "Beams and hanger installed and level" },
  { key: "panels",      label: "Panels installed, fastened and clipped" },
  { key: "gutter",      label: "Gutter, fascia and trim installed" },
  { key: "downspouts",  label: "Downspouts and dropouts connected" },
  { key: "sealed",      label: "Silicone / caulk applied where needed" },
  { key: "extras",      label: "Any extras on the job done (walls, extra beams, brackets)" },
  { key: "cleanup",     label: "Site cleaned up and debris hauled away" },
  { key: "walkthrough", label: "Walkthrough done with the customer" },
];

export type InstallChecklistState = Record<string, boolean>;

export function checklistComplete(state: InstallChecklistState | null | undefined): boolean {
  return INSTALL_CHECKLIST.every((i) => state?.[i.key] === true);
}

export function checklistDoneCount(state: InstallChecklistState | null | undefined): number {
  return INSTALL_CHECKLIST.filter((i) => state?.[i.key] === true).length;
}
