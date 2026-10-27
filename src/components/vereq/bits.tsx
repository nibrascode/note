import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { COVERS, FORMATS, PAPERS, coverName, formatName, paperFill, paperName, type CoverId, type FormatId, type Page, type PaperId } from "@/lib/notebook";
import { drawStroke } from "@/components/vereq/paper";
import { useBook } from "@/lib/store";

export function Overlay({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="tray"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

export function DeleteChoice({
  label,
  ask,
  yes,
  no,
  onYes,
}: {
  label: string;
  ask: string;
  yes: string;
  no: string;
  onYes: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="menu-btn danger" onClick={() => setOpen(true)}>
        <Trash2 size={18} /> {label}
      </button>
    );
  }
  return (
    <div className="confirm-box">
      <p>{ask}</p>
      <div className="confirm-actions">
        <button type="button" className="menu-btn" onClick={() => setOpen(false)}>
          {no}
        </button>
        <button type="button" className="menu-btn danger" onClick={onYes}>
          {yes}
        </button>
      </div>
    </div>
  );
}

export function FormatPicker({
  value,
  paper,
  onChange,
}: {
  value: FormatId;
  paper: PaperId;
  onChange: (format: FormatId) => void;
}) {
  const lang = useBook((s) => s.lang);
  return (
    <div className="hscroll">
      {FORMATS.map((format) => (
        <button
          key={format.id}
          type="button"
          className="mini-btn"
          data-picked={format.id === value ? "true" : "false"}
          aria-pressed={format.id === value}
          onClick={() => onChange(format.id)}
        >
          <span className="mini" data-paper={paper} data-format={format.id} />
          <span className="mini-name">{formatName(format.id, lang)}</span>
        </button>
      ))}
    </div>
  );
}

export function PaperPicker({
  value,
  onChange,
}: {
  value: PaperId;
  onChange: (paper: PaperId) => void;
}) {
  const lang = useBook((s) => s.lang);
  return (
    <div className="paper-row">
      {PAPERS.map((paper) => (
        <button
          key={paper.id}
          type="button"
          className="paper-face"
          data-paper={paper.id}
          data-picked={paper.id === value ? "true" : "false"}
          aria-label={paperName(paper.id, lang)}
          aria-pressed={paper.id === value}
          onClick={() => onChange(paper.id)}
        >
          <span className="paper-face-sheet" />
          <span>{paperName(paper.id, lang)}</span>
        </button>
      ))}
    </div>
  );
}

export function CoverPicker({
  value,
  onChange,
}: {
  value: CoverId;
  onChange: (cover: CoverId) => void;
}) {
  const lang = useBook((s) => s.lang);
  return (
    <div className="swatch-row">
      {COVERS.map((cover) => (
        <button
          key={cover.id}
          type="button"
          className="dot cover-dot"
          data-cover={cover.id}
          data-picked={cover.id === value ? "true" : "false"}
          aria-label={coverName(cover.id, lang)}
          aria-pressed={cover.id === value}
          onClick={() => onChange(cover.id)}
        />
      ))}
    </div>
  );
}

export function PageThumb({ page }: { page: Page }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const w = 48;
    const h = 64;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paperFill(page.paper);
    ctx.fillRect(0, 0, w, h);
    const ys = page.strokes.flatMap((stroke) => stroke.points.map((pt) => pt.y));
    const maxY = Math.max(320, ...(ys.length ? ys : [320]));
    ctx.save();
    ctx.scale(w / 280, h / maxY);
    for (const stroke of page.strokes) drawStroke(ctx, stroke, 280, page.paper);
    ctx.restore();
    if (!page.strokes.length) {
      const line = (page.title || page.main || "").trim().slice(0, 16);
      if (line) {
        ctx.fillStyle = page.paper === "night" ? "#cbbde0" : "#6d5c4c";
        ctx.font = "7px sans-serif";
        ctx.fillText(line, 4, 14);
      }
    }
  }, [page]);
  return <canvas ref={ref} className="toc-thumb" aria-hidden="true" />;
}
