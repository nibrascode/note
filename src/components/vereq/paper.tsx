import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check, Plus, Star, X } from "lucide-react";
import {
  blankItem,
  inkHex,
  placeholderFor,
  type InkId,
  type Page,
  type PageImage,
  type PageNote,
  type PenWidth,
  type Stroke,
  type Tool,
} from "@/lib/notebook";
import { text } from "@/lib/i18n";
import { useBook } from "@/lib/store";

const imageCache = new Map<string, HTMLImageElement>();

function ensureImage(src: string, onLoad: () => void) {
  let image = imageCache.get(src);
  if (!image) {
    image = new Image();
    image.onload = onLoad;
    image.src = src;
    imageCache.set(src, image);
  }
  return image;
}

function drawStamp(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, paper: Page["paper"]) {
  const pt = stroke.points[0];
  if (!pt) return;
  const r = 11 * (stroke.width || 2);
  const x = pt.x * width;
  const y = pt.y;
  const color = inkHex(stroke.ink, paper);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.95;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (stroke.shape === "star") {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const inner = outer + Math.PI / 5;
      if (i === 0) ctx.moveTo(x + Math.cos(outer) * r, y + Math.sin(outer) * r);
      else ctx.lineTo(x + Math.cos(outer) * r, y + Math.sin(outer) * r);
      ctx.lineTo(x + Math.cos(inner) * r * 0.42, y + Math.sin(inner) * r * 0.42);
    }
    ctx.closePath();
    ctx.fill();
    return;
  }
  if (stroke.shape === "check") {
    ctx.lineWidth = Math.max(1.6, r * 0.22);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, y + r * 0.02);
    ctx.lineTo(x - r * 0.12, y + r * 0.46);
    ctx.lineTo(x + r * 0.64, y - r * 0.48);
    ctx.stroke();
    return;
  }
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.72, y);
  ctx.lineTo(x + r * 0.28, y);
  ctx.moveTo(x + r * 0.05, y - r * 0.36);
  ctx.lineTo(x + r * 0.7, y);
  ctx.lineTo(x + r * 0.05, y + r * 0.36);
  ctx.stroke();
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, width: number, paper: Page["paper"]) {
  const pts = stroke.points;
  if (!pts.length) return;
  const size = stroke.width || 2;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = inkHex(stroke.ink, paper);
  if (stroke.tool === "shape") {
    if (stroke.shape === "star" || stroke.shape === "arrow" || stroke.shape === "check") {
      drawStamp(ctx, stroke, width, paper);
      ctx.restore();
      return;
    }
    const a = pts[0];
    const b = pts[pts.length - 1];
    const x1 = a.x * width;
    const y1 = a.y;
    const x2 = b.x * width;
    const y2 = b.y;
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.max(1, Math.abs(x2 - x1));
    const h = Math.max(1, Math.abs(y2 - y1));
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 1.15 * size;
    ctx.beginPath();
    if (stroke.shape === "rect") ctx.strokeRect(left, top, w, h);
    else if (stroke.shape === "ellipse") {
      ctx.ellipse(left + w / 2, top + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const marker = stroke.tool === "marker";
  const pencil = stroke.tool === "pencil";
  const fountain = stroke.tool === "fountain";
  const brush = stroke.tool === "brush";
  const nib = stroke.tool === "nib";
  const gel = stroke.tool === "gel";
  const color = inkHex(stroke.ink, paper);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (stroke.ink === "neon") {
    ctx.shadowColor = color;
    ctx.shadowBlur = 9;
  }
  if (brush || nib) {
    ctx.globalAlpha = brush ? 0.9 : 0.96;
    const base = (brush ? 8.2 : 3.6) * (size / 2);
    if (pts.length === 1) {
      ctx.beginPath();
      ctx.arc(pts[0].x * width, pts[0].y, base / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let i = 1; i < pts.length; i++) {
        const dx = (pts[i].x - pts[i - 1].x) * width;
        const dy = pts[i].y - pts[i - 1].y;
        const dist = Math.hypot(dx, dy) || 1;
        const lean = Math.min(1.25, Math.abs(dy) / dist);
        const w = brush ? base * (1.28 - Math.min(1, dist / 18) * 0.82) : base * (0.32 + lean * 1.45);
        ctx.beginPath();
        ctx.lineWidth = Math.max(0.7, w);
        ctx.moveTo(pts[i - 1].x * width, pts[i - 1].y);
        ctx.lineTo(pts[i].x * width, pts[i].y);
        ctx.stroke();
      }
    }
    ctx.restore();
    return;
  }
  ctx.globalAlpha = marker ? 0.34 : pencil ? 0.62 : gel ? 0.94 : 0.96;
  ctx.lineWidth = (marker ? 16 : gel ? 3.6 : fountain ? 3.1 : pencil ? 1.35 : 2.15) * (size / 2);
  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x * width, pts[0].y);
    if (pts.length === 1) {
      ctx.lineTo(pts[0].x * width + 0.2, pts[0].y + 0.2);
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = ((pts[i].x + pts[i + 1].x) / 2) * width;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x * width, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    ctx.quadraticCurveTo(prev.x * width, prev.y, last.x * width, last.y);
  };
  trace();
  ctx.stroke();
  if (gel || stroke.ink === "gold") {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = gel ? 0.55 : 0.4;
    ctx.strokeStyle = stroke.ink === "gold" ? "#fff1c2" : "#fff8ee";
    ctx.lineWidth = Math.max(0.6, ctx.lineWidth * 0.28);
    ctx.translate(-0.45, -0.55);
    trace();
    ctx.stroke();
  }
  if (pencil) {
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = Math.max(0.6, ctx.lineWidth * 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function paintImages(ctx: CanvasRenderingContext2D, images: PageImage[], width: number, onLoad: () => void) {
  for (const img of images) {
    const el = ensureImage(img.src, onLoad);
    if (!el.complete || !el.naturalWidth) continue;
    const dw = img.w * width;
    const dh = dw * (el.naturalHeight / el.naturalWidth);
    ctx.drawImage(el, img.x * width, img.y, dw, dh);
  }
}

function Ruled({
  value,
  placeholder,
  label,
  margin = true,
  className = "field field-self-ruled",
  onChange,
}: {
  value: string;
  placeholder: string;
  label: string;
  margin?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  const rows = Math.max(12, value.split("\n").length + 4);
  return (
    <textarea
      className={className}
      data-margin={margin ? "on" : "off"}
      rows={rows}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      lang="az"
      spellCheck
      autoCapitalize="sentences"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function Paper({
  page,
  tool,
  ink,
  penWidth,
  reading,
  onChange,
}: {
  page: Page;
  tool: Tool;
  ink: InkId;
  penWidth: PenWidth;
  reading: boolean;
  onChange: (patch: Partial<Page>) => void;
}) {
  const lang = useBook((s) => s.lang);
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef(page.strokes);
  const paperRef = useRef(page.paper);
  const toolRef = useRef(tool);
  const inkRef = useRef(ink);
  const widthRef = useRef(penWidth);
  const imagesRef = useRef(page.images ?? []);
  const notesRef = useRef(page.notes ?? []);
  const onChangeRef = useRef(onChange);
  const draftRef = useRef<Stroke | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number; ix: number; iy: number } | null>(null);
  const erasedRef = useRef<Set<string>>(new Set());
  const erasingRef = useRef(false);
  const handRef = useRef({ pen: 0, touch: null as number | null });
  const glideRef = useRef<{ x: number; y: number } | null>(null);
  const holdRef = useRef<number | null>(null);
  const holdPos = useRef({ x: 0, y: 0 });
  const [focusId, setFocusId] = useState<string | null>(null);

  strokesRef.current = page.strokes;
  paperRef.current = page.paper;
  toolRef.current = tool;
  inkRef.current = ink;
  widthRef.current = penWidth;
  imagesRef.current = page.images ?? [];
  notesRef.current = page.notes ?? [];
  onChangeRef.current = onChange;

  const repaint = () => {
    const canvas = canvasRef.current;
    const inner = innerRef.current;
    if (!canvas || !inner) return;
    const width = inner.clientWidth;
    const height = inner.clientHeight;
    if (width < 2 || height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    paintImages(ctx, imagesRef.current, width, repaint);
    const live = strokesRef.current.filter((stroke) => !erasedRef.current.has(stroke.id));
    const draft = draftRef.current;
    for (const stroke of draft ? [...live, draft] : live) {
      drawStroke(ctx, stroke, width, paperRef.current);
    }
  };

  useEffect(() => {
    const sheet = scrollRef.current;
    const inner = innerRef.current;
    if (!sheet || !inner) return;
    const measure = () => {
      sheet.style.setProperty("--page-h", `${sheet.clientHeight}px`);
      repaint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [page.id, page.format, page.main, page.side, page.summary, page.items.length, page.hours.length]);

  useEffect(() => {
    repaint();
  }, [page.strokes, page.paper, page.images]);

  const pointFrom = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    return {
      x: Math.min(1, Math.max(0, x)),
      y: Math.max(0, event.clientY - rect.top),
    };
  };

  const eraseAt = (x: number, y: number) => {
    const width = canvasRef.current?.clientWidth ?? 1;
    let hit = false;
    for (const stroke of strokesRef.current) {
      if (erasedRef.current.has(stroke.id)) continue;
      const near = stroke.points.some((pt) => {
        const dx = (pt.x - x) * width;
        const dy = pt.y - y;
        return dx * dx + dy * dy < 26 * 26;
      });
      if (near) {
        erasedRef.current.add(stroke.id);
        hit = true;
      }
    }
    if (hit) repaint();
  };

  const commit = () => {
    const draft = draftRef.current;
    const erased = [...erasedRef.current];
    draftRef.current = null;
    erasingRef.current = false;
    erasedRef.current = new Set();
    if (!draft && erased.length === 0) return;
    let next = strokesRef.current.filter((stroke) => !erased.includes(stroke.id));
    if (draft && draft.points.length) {
      next = [...next, { ...draft, points: draft.points.map((pt) => ({ ...pt })) }].slice(-160);
    }
    onChangeRef.current({ strokes: next });
  };

  const hitImage = (x: number, y: number) => {
    const box = canvasRef.current?.clientWidth ?? 1;
    const list = imagesRef.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const img = list[i];
      const el = imageCache.get(img.src);
      const ratio = el && el.naturalWidth ? el.naturalHeight / el.naturalWidth : 0.75;
      const dw = img.w * box;
      const dh = dw * ratio;
      const left = img.x * box;
      if (x * box >= left && x * box <= left + dw && y >= img.y && y <= img.y + dh) return img;
    }
    return null;
  };

  const finish = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const owned =
      event.pointerType === "mouse" ||
      event.pointerType === "pen" ||
      handRef.current.touch === event.pointerId;
    if (event.pointerType === "pen") handRef.current.pen = Math.max(0, handRef.current.pen - 1);
    if (handRef.current.touch === event.pointerId) handRef.current.touch = null;
    if (!owned) return;
    glideRef.current = null;
    if (dragRef.current) {
      dragRef.current = null;
      onChangeRef.current({ images: imagesRef.current.map((image) => ({ ...image })) });
      return;
    }
    commit();
  };

  const palm = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "pen" || event.pointerType === "mouse") return false;
    if (handRef.current.pen > 0) return true;
    const span = Math.max(event.width || 0, event.height || 0);
    if (span > 48) return true;
    return handRef.current.touch != null && handRef.current.touch !== event.pointerId;
  };

  const glide = (raw: { x: number; y: number }) => {
    const prev = glideRef.current ?? raw;
    const next = { x: prev.x + (raw.x - prev.x) * 0.62, y: prev.y + (raw.y - prev.y) * 0.62 };
    glideRef.current = next;
    return next;
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (toolRef.current === "text") return;
    if (palm(event)) return;
    if (event.pointerType === "pen") handRef.current.pen += 1;
    if (event.pointerType === "touch") handRef.current.touch = event.pointerId;
    event.preventDefault();
    const point = pointFrom(event);
    glideRef.current = point;
    if (toolRef.current === "move") {
      const hit = hitImage(point.x, point.y);
      if (!hit) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = { id: hit.id, ox: point.x, oy: point.y, ix: hit.x, iy: hit.y };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (toolRef.current === "eraser") {
      erasingRef.current = true;
      eraseAt(point.x, point.y);
      return;
    }
    const kind = toolRef.current;
    const shape =
      kind === "line" || kind === "rect" || kind === "ellipse" || kind === "star" || kind === "arrow" || kind === "check"
        ? kind
        : null;
    draftRef.current = {
      id: `s${Date.now().toString(36)}`,
      tool: shape
        ? "shape"
        : kind === "pencil" || kind === "fountain" || kind === "marker" || kind === "brush" || kind === "gel" || kind === "nib"
          ? kind
          : "pen",
      shape: shape ?? undefined,
      ink: inkRef.current,
      width: widthRef.current,
      points: [point],
    };
    repaint();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (toolRef.current === "text" || palm(event)) return;
    const raw = pointFrom(event);
    const kind = toolRef.current;
    const direct =
      kind === "move" ||
      kind === "eraser" ||
      kind === "line" ||
      kind === "rect" ||
      kind === "ellipse" ||
      kind === "star" ||
      kind === "arrow" ||
      kind === "check";
    const point = direct ? raw : glide(raw);
    const drag = dragRef.current;
    if (drag) {
      const dx = point.x - drag.ox;
      const dy = point.y - drag.oy;
      imagesRef.current = imagesRef.current.map((image) =>
        image.id === drag.id
          ? {
              ...image,
              x: Math.min(0.86, Math.max(-0.2, drag.ix + dx)),
              y: Math.max(-24, drag.iy + dy),
            }
          : image,
      );
      repaint();
      return;
    }
    if (erasingRef.current) {
      eraseAt(point.x, point.y);
      return;
    }
    const draft = draftRef.current;
    if (!draft) return;
    if (draft.tool === "shape") {
      draft.points = [draft.points[0], point];
      repaint();
      return;
    }
    const last = draft.points[draft.points.length - 1];
    const width = event.currentTarget.clientWidth || 1;
    const dx = (point.x - last.x) * width;
    const dy = point.y - last.y;
    if (dx * dx + dy * dy < 8) return;
    if (draft.points.length < 500) draft.points.push(point);
    repaint();
  };

  const setItems = (items: Page["items"]) => onChange({ items });

  const notes = page.notes ?? [];

  useEffect(() => {
    if (!focusId) return;
    const field = innerRef.current?.querySelector(`[data-note="${focusId}"]`);
    if (field instanceof HTMLTextAreaElement) field.focus();
    setFocusId(null);
  }, [focusId, notes]);

  const placeAt = (clientX: number, clientY: number) => {
    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const x = Math.min(0.62, Math.max(0.03, (clientX - rect.left) / (rect.width || 1)));
    const y = Math.max(0, clientY - rect.top);
    const id = `n${Date.now().toString(36)}`;
    const next = [
      ...notesRef.current,
      { id, text: "", x, y, w: Math.min(0.74, Math.max(0.34, 0.96 - x)) },
    ].slice(-24);
    notesRef.current = next;
    onChangeRef.current({ notes: next });
    setFocusId(id);
  };

  const cancelHold = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  };

  const blocked = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return true;
    return Boolean(target.closest("button, input, .free-note, .mast"));
  };

  const onSheetDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (tool !== "text" || reading || blocked(event.target)) return;
    const field = event.target instanceof Element ? event.target.closest("textarea") : null;
    const empty = field instanceof HTMLTextAreaElement && field.value.trim() === "";
    if (!field || empty) {
      event.preventDefault();
      placeAt(event.clientX, event.clientY);
      return;
    }
    cancelHold();
    holdPos.current = { x: event.clientX, y: event.clientY };
    holdRef.current = window.setTimeout(() => {
      holdRef.current = null;
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      placeAt(holdPos.current.x, holdPos.current.y);
    }, 460);
  };

  const onSheetMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!holdRef.current) return;
    const dx = event.clientX - holdPos.current.x;
    const dy = event.clientY - holdPos.current.y;
    if (dx * dx + dy * dy > 36) cancelHold();
  };

  const dragNote = (event: ReactPointerEvent<HTMLButtonElement>, note: PageNote) => {
    event.stopPropagation();
    event.preventDefault();
    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const origin = { x: event.clientX, y: event.clientY, nx: note.x, ny: note.y, id: note.id };
    const move = (ev: PointerEvent) => {
      const x = Math.min(0.72, Math.max(0, origin.nx + (ev.clientX - origin.x) / (rect.width || 1)));
      const y = Math.max(0, origin.ny + (ev.clientY - origin.y));
      const next = notesRef.current.map((item) => (item.id === origin.id ? { ...item, x, y } : item));
      notesRef.current = next;
      onChangeRef.current({ notes: next });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      ref={scrollRef}
      className="sheet"
      data-paper={page.paper}
      data-format={page.format}
      data-ink={ink}
      data-draw={tool === "text" || reading ? "off" : "on"}
      onPointerDown={onSheetDown}
      onPointerMove={onSheetMove}
      onPointerUp={cancelHold}
      onPointerCancel={cancelHold}
      onDoubleClick={(event) => {
        if (tool !== "text" || reading || blocked(event.target)) return;
        const field = event.target instanceof Element ? event.target.closest("textarea") : null;
        if (field instanceof HTMLTextAreaElement && field.value.trim() === "") return;
        event.preventDefault();
        placeAt(event.clientX, event.clientY);
      }}
    >
      <div className="sheet-inner" ref={innerRef} data-marked={page.marked ? "true" : "false"}>
        {page.format === "journal" ? (
          <>
            <header className="mast">
              <Star className="star" size={18} strokeWidth={2.4} aria-hidden="true" />
              <div>
                <p className="eyebrow">{text(lang, "journal")}</p>
                <input
                  className="mast-date"
                  value={page.dateLabel}
                  aria-label="date"
                  style={{ background: "transparent", border: 0, outline: "none", font: "inherit", color: "inherit", padding: 0, width: "100%" }}
                  onChange={(event) => onChange({ dateLabel: event.target.value })}
                />
              </div>
            </header>
            <Ruled
              value={page.main}
              placeholder={placeholderFor("journal", lang)}
              label={text(lang, "journalBody")}
              onChange={(main) => onChange({ main })}
            />
          </>
        ) : null}

        {page.format === "lined" || page.format === "narrow" || page.format === "wide" ? (
          <Ruled
            value={page.main}
            placeholder={placeholderFor(page.format, lang)}
            label={text(lang, "text")}
            onChange={(main) => onChange({ main })}
          />
        ) : null}

        {page.format === "blank" || page.format === "grid" || page.format === "dots" ? (
          <Ruled
            value={page.main}
            placeholder={placeholderFor(page.format, lang)}
            label={text(lang, "text")}
            className="field field-prose"
            onChange={(main) => onChange({ main })}
          />
        ) : null}

        {page.format === "columns" ? (
          <div className="split">
            <Ruled
              value={page.main}
              placeholder={text(lang, "left")}
              label={text(lang, "left")}
              className="field field-prose"
              onChange={(main) => onChange({ main })}
            />
            <Ruled
              value={page.side}
              placeholder={text(lang, "right")}
              label={text(lang, "right")}
              className="field field-prose"
              onChange={(side) => onChange({ side })}
            />
          </div>
        ) : null}

        {page.format === "margin" ? (
          <div className="margin-split">
            <Ruled
              value={page.side}
              placeholder={text(lang, "sidePh")}
              label={text(lang, "side")}
              className="field side"
              onChange={(side) => onChange({ side })}
            />
            <Ruled
              value={page.main}
              placeholder={placeholderFor("lined", lang)}
              label={text(lang, "main")}
              margin={false}
              onChange={(main) => onChange({ main })}
            />
          </div>
        ) : null}

        {page.format === "cornell" ? (
          <div className="cornell">
            <div className="cornell-body">
              <Ruled
                value={page.side}
                placeholder={text(lang, "cues")}
                label={text(lang, "cues")}
                className="field cues"
                onChange={(side) => onChange({ side })}
              />
              <Ruled
                value={page.main}
                placeholder={text(lang, "notes")}
                label={text(lang, "notes")}
                margin={false}
                onChange={(main) => onChange({ main })}
              />
            </div>
            <div className="cornell-foot">
              <p className="eyebrow">{text(lang, "sum")}</p>
              <Ruled
                value={page.summary}
                placeholder={text(lang, "sumPh")}
                label={text(lang, "sum")}
                className="field"
                onChange={(summary) => onChange({ summary })}
              />
            </div>
          </div>
        ) : null}

        {page.format === "checklist" ? (
          <div className="check-list">
            {page.items.map((item) => (
              <div className="check-row" key={item.id}>
                <button
                  type="button"
                  className="check"
                  data-on={item.done ? "true" : "false"}
                  aria-label={item.done ? text(lang, "unmark") : text(lang, "done")}
                  aria-pressed={item.done}
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
                    setItems(page.items.map((row) => (row.id === item.id ? { ...row, done: !row.done } : row)));
                  }}
                >
                  <span className="check-box">{item.done ? <Check size={14} strokeWidth={3} /> : null}</span>
                </button>
                <input
                  className="check-input"
                  data-done={item.done ? "true" : "false"}
                  value={item.text}
                  placeholder={text(lang, "row")}
                  aria-label={text(lang, "rowLabel")}
                  lang={lang}
                  onChange={(event) =>
                    setItems(page.items.map((row) => (row.id === item.id ? { ...row, text: event.target.value } : row)))
                  }
                />
                <button
                  type="button"
                  className="row-x"
                  aria-label={text(lang, "rowDel")}
                  onClick={() => setItems(page.items.filter((row) => row.id !== item.id))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-row"
              onClick={() => setItems([...page.items, blankItem()])}
            >
              <Plus size={16} /> {text(lang, "addRow")}
            </button>
          </div>
        ) : null}

        {page.format === "planner" ? (
          <div className="planner">
            {page.hours.map((hour, index) => (
              <div className="hour-row" key={hour.label}>
                <span className="hour-label">{hour.label}</span>
                <input
                  className="hour-input"
                  value={hour.text}
                  placeholder="—"
                  aria-label={`${hour.label} ${text(lang, "plan")}`}
                  lang={lang}
                  onChange={(event) =>
                    onChange({
                      hours: page.hours.map((slot, slotIndex) =>
                        slotIndex === index ? { ...slot, text: event.target.value } : slot,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : null}

        <canvas
          ref={canvasRef}
          className="draw-layer"
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finish}
          onPointerCancel={finish}
        />
        {notes.map((note) => (
          <div
            key={note.id}
            className="free-note"
            style={{ left: `${note.x * 100}%`, top: note.y, width: `${note.w * 100}%` }}
          >
            {reading ? null : (
              <button
                type="button"
                className="free-grip"
                aria-label={text(lang, "toolMove")}
                onPointerDown={(event) => dragNote(event, note)}
              />
            )}
            <textarea
              data-note={note.id}
              rows={Math.max(1, note.text.split("\n").length)}
              value={note.text}
              readOnly={reading}
              placeholder={text(lang, "text")}
              aria-label={text(lang, "text")}
              lang={lang}
              spellCheck
              onChange={(event) =>
                onChange({
                  notes: notes.map((item) => (item.id === note.id ? { ...item, text: event.target.value } : item)),
                })
              }
              onBlur={(event) => {
                const next = event.relatedTarget;
                if (next instanceof Node && event.currentTarget.parentElement?.contains(next)) return;
                if (event.currentTarget.value.trim()) return;
                onChange({ notes: notes.filter((item) => item.id !== note.id) });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
