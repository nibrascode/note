import { nativeShareFile } from "./native-share";
import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";

const PAGE_W = 210;
const PAGE_H = 297;

export function fileStem(title: string) {
  return title.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "nibras-note";
}

function sliceCanvas(source: HTMLCanvasElement, y: number, height: number) {
  const part = document.createElement("canvas");
  part.width = source.width;
  part.height = height;
  const ctx = part.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(source, 0, y, source.width, height, 0, 0, source.width, height);
  return part.toDataURL("image/jpeg", 0.95);
}

function paintClone(sheet: HTMLElement) {
  const clone = sheet.cloneNode(true) as HTMLElement;
  const fields = [...sheet.querySelectorAll("textarea")];
  const copies = [...clone.querySelectorAll("textarea")];
  fields.forEach((field, index) => {
    const source = field as HTMLTextAreaElement;
    const block = document.createElement("div");
    block.className = source.className;
    const margin = source.getAttribute("data-margin");
    if (margin) block.setAttribute("data-margin", margin);
    block.textContent = source.value;
    block.style.whiteSpace = "pre-wrap";
    block.style.overflow = "visible";
    copies[index]?.replaceWith(block);
  });
  const canvases = [...sheet.querySelectorAll("canvas")];
  const cloneCanvases = [...clone.querySelectorAll("canvas")];
  canvases.forEach((canvas, index) => {
    const img = document.createElement("img");
    img.alt = "";
    img.src = canvas.toDataURL("image/png");
    img.className = "draw-layer";
    cloneCanvases[index]?.replaceWith(img);
  });
  const holder = document.createElement("div");
  holder.className = "pdf-stage";
  holder.append(clone);
  document.body.append(holder);
  return { clone, holder };
}

export async function captureSheet(sheet: HTMLElement) {
  const inner = sheet.querySelector(".sheet-inner");
  const full = Math.max(sheet.clientHeight, inner?.scrollHeight ?? 0, sheet.scrollHeight);
  if (full > sheet.clientHeight + 2) {
    sheet.style.height = `${full}px`;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  const { clone, holder } = paintClone(sheet);
  try {
    const pixelRatio = sheet.clientWidth * sheet.clientHeight > 1_600_000 ? 2 : 3;
    const canvas = await toCanvas(clone, {
      pixelRatio,
      cacheBust: true,
      backgroundColor: getComputedStyle(sheet).backgroundColor || "#f6ecd8",
    });
    return canvas.width < 2 || canvas.height < 2 ? null : canvas;
  } finally {
    holder.remove();
  }
}

export async function sheetsToPdfFile(sheets: HTMLElement[], title: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let started = false;
  for (const sheet of sheets) {
    const canvas = await captureSheet(sheet);
    if (!canvas) continue;
    const slicePx = Math.max(1, Math.floor(canvas.width * (PAGE_H / PAGE_W)));
    for (let y = 0; y < canvas.height; y += slicePx) {
      const height = Math.min(slicePx, canvas.height - y);
      const data = sliceCanvas(canvas, y, height);
      if (!data) continue;
      if (started) pdf.addPage();
      started = true;
      const drawH = (height / canvas.width) * PAGE_W;
      pdf.addImage(data, "JPEG", 0, 0, PAGE_W, drawH, undefined, "SLOW");
    }
  }
  if (!started) return null;
  const blob = pdf.output("blob");
  return new File([blob], `${fileStem(title)}.pdf`, { type: "application/pdf" });
}

export async function sheetToPngFile(sheet: HTMLElement, title: string) {
  const canvas = await captureSheet(sheet);
  if (!canvas) return null;
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return null;
  return new File([blob], `${fileStem(title)}.png`, { type: "image/png" });
}

export async function shareOrSave(file: File) {
  if (await nativeShareFile(file, file.name)) return;
  const payload = { files: [file], title: file.name };
  if (typeof navigator.share === "function" && navigator.canShare?.(payload)) {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

export async function downloadNotebookPdf(sheets: HTMLElement[], title: string) {
  const file = await sheetsToPdfFile(sheets, title);
  if (file) await shareOrSave(file);
}
