import { nativeShareFile } from "./native-share";
import type { Notebook } from "@/lib/notebook";

export function backupFile(notebooks: Notebook[]) {
  return JSON.stringify({
    app: "nibras-note",
    version: 1,
    savedAt: Date.now(),
    notebooks,
  });
}

export function parseBackup(raw: string): Notebook[] | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const record = data as { app?: unknown; notebooks?: unknown };
  if ((record.app !== "nibras-note" && record.app !== "vereq") || !Array.isArray(record.notebooks)) return null;
  const notebooks = record.notebooks.filter(
    (item): item is Notebook =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as Notebook).id === "string" &&
      typeof (item as Notebook).title === "string",
  );
  return notebooks.length === record.notebooks.length ? notebooks : null;
}

export async function downloadBackup(notebooks: Notebook[]) {
  const blob = new Blob([backupFile(notebooks)], { type: "application/json" });
  const day = new Date().toISOString().slice(0, 10);
  if (await nativeShareFile(blob, `nibras-note-${day}.json`)) return;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `nibras-note-${day}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
