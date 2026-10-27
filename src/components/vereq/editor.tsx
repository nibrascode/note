import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Brush,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Copy,
  Eraser,
  Feather,
  Eye,
  EyeOff,
  Highlighter,
  Image,
  Minus,
  MoreHorizontal,
  Move,
  PenLine,
  PenTool,
  Pencil,
  Pin,
  Plus,
  Redo2,
  Share2,
  Sparkles,
  Square,
  Star,
  Type,
  Undo2,
} from "lucide-react";
import {
  blankHours,
  blankItem,
  coverName,
  drawsInk,
  formatName,
  INKS,
  inkName,
  pageName,
  pagePlain,
  paperName,
  type FormatId,
  type Notebook,
  type Page,
  type PaperId,
  type Tool,
} from "@/lib/notebook";
import { useBook } from "@/lib/store";
import { text, type CopyKey } from "@/lib/i18n";
import { CoverPicker, DeleteChoice, FormatPicker, Overlay, PageThumb, PaperPicker } from "@/components/vereq/bits";
import { Paper } from "@/components/vereq/paper";
import { PdfBook } from "@/components/vereq/pdf-book";
import { shareOrSave, sheetsToPdfFile, sheetToPngFile } from "@/lib/export-pdf";

const TOOLS: { id: Tool; key: CopyKey; icon: typeof PenLine }[] = [
  { id: "text", key: "toolText", icon: Type },
  { id: "pen", key: "toolPen", icon: PenLine },
  { id: "pencil", key: "toolPencil", icon: Pencil },
  { id: "fountain", key: "toolFountain", icon: PenTool },
  { id: "brush", key: "toolBrush", icon: Brush },
  { id: "gel", key: "toolGel", icon: Sparkles },
  { id: "nib", key: "toolNib", icon: Feather },
  { id: "marker", key: "toolMarker", icon: Highlighter },
  { id: "eraser", key: "toolEraser", icon: Eraser },
  { id: "line", key: "toolLine", icon: Minus },
  { id: "rect", key: "toolRect", icon: Square },
  { id: "ellipse", key: "toolEllipse", icon: Circle },
  { id: "star", key: "toolStar", icon: Star },
  { id: "arrow", key: "toolArrow", icon: ArrowRight },
  { id: "check", key: "toolCheck", icon: Check },
  { id: "move", key: "toolMove", icon: Move },
];

function shrinkImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("şəkil oxunmadı"));
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("şəkil hazır deyil"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => reject(new Error("şəkil açılmadı"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function Editor({ book }: { book: Notebook }) {
  const close = useBook((s) => s.close);
  const tool = useBook((s) => s.tool);
  const ink = useBook((s) => s.ink);
  const penWidth = useBook((s) => s.penWidth);
  const reading = useBook((s) => s.reading);
  const redoMap = useBook((s) => s.redo);
  const setTool = useBook((s) => s.setTool);
  const setInk = useBook((s) => s.setInk);
  const setWidth = useBook((s) => s.setWidth);
  const setReading = useBook((s) => s.setReading);
  const forgetRedo = useBook((s) => s.forgetRedo);
  const undoStroke = useBook((s) => s.undoStroke);
  const redoStroke = useBook((s) => s.redoStroke);
  const rename = useBook((s) => s.rename);
  const duplicate = useBook((s) => s.duplicate);
  const remove = useBook((s) => s.remove);
  const setCover = useBook((s) => s.setCover);
  const togglePin = useBook((s) => s.togglePin);
  const setCursor = useBook((s) => s.setCursor);
  const movePage = useBook((s) => s.movePage);
  const updatePage = useBook((s) => s.updatePage);
  const setPageStyle = useBook((s) => s.setPageStyle);
  const addPage = useBook((s) => s.addPage);
  const duplicatePage = useBook((s) => s.duplicatePage);
  const deletePage = useBook((s) => s.deletePage);
  const lang = useBook((s) => s.lang);

  const [pageId, setPageId] = useState(book.pages[book.cursor]?.id ?? book.pages[0]?.id ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(book.title);
  const [pageDraft, setPageDraft] = useState("");
  const [tray, setTray] = useState<null | "style" | "menu" | "pages">(null);
  const [pdfOn, setPdfOn] = useState(false);
  const [pageOut, setPageOut] = useState<null | "pdf" | "png">(null);
  const [zoom, setZoom] = useState(1);
  const known = useRef({ id: "", pages: [] as string[] });
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  zoomRef.current = zoom;

  useEffect(() => {
    const ids = book.pages.map((item) => item.id);
    const switched = known.current.id !== book.id;
    if (switched) {
      const at = Math.min(book.cursor ?? 0, Math.max(0, ids.length - 1));
      setPageId(ids[at] ?? "");
      setEditing(false);
      setDraft(book.title);
      setTray(null);
    } else {
      const added = ids.find((id) => !known.current.pages.includes(id));
      if (added) setPageId(added);
    }
    known.current = { id: book.id, pages: ids };
  }, [book.id, book.pages, book.title]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let pinching = false;
    let startDist = 1;
    let startZoom = 1;
    const gap = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.hypot(dx, dy) || 1;
    };
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      pinching = true;
      startDist = gap(event.touches);
      startZoom = zoomRef.current;
    };
    const move = (event: TouchEvent) => {
      if (!pinching || event.touches.length < 2) return;
      event.preventDefault();
      const next = Math.min(2.4, Math.max(1, startZoom * (gap(event.touches) / startDist)));
      setZoom(Math.round(next * 20) / 20);
    };
    const end = () => {
      pinching = false;
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, []);

  useEffect(() => {
    if (!tray) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTray(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tray]);

  const found = book.pages.findIndex((item) => item.id === pageId);
  const index = found >= 0 ? found : 0;
  const page = book.pages[index];

  useEffect(() => {
    if (page && book.cursor !== index) setCursor(book.id, index);
  }, [book.cursor, book.id, index, page, setCursor]);

  if (!page) return null;

  const saveTitle = () => {
    rename(book.id, draft);
    setEditing(false);
  };

  const clearPage = () => {
    updatePage(book.id, page.id, {
      main: "",
      side: "",
      summary: "",
      strokes: [],
      notes: [],
      items: page.format === "checklist" ? [blankItem(), blankItem(), blankItem()] : [],
      hours: page.format === "planner" ? blankHours() : [],
    });
  };

  const exportLive = (kind: "pdf" | "png") => {
    const sheet = document.querySelector(".stage .sheet");
    if (!(sheet instanceof HTMLElement) || pageOut) return;
    setPageOut(kind);
    const name = page.title.trim() || `${book.title} ${index + 1}`;
    const job = kind === "png" ? sheetToPngFile(sheet, name) : sheetsToPdfFile([sheet], name);
    void job.then((file) => (file ? shareOrSave(file) : undefined)).finally(() => setPageOut(null));
  };

  return (
    <div className="device" data-paper={page.paper} data-reading={reading ? "true" : "false"}>
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label={text(lang, "back")} onClick={close}>
          <ChevronLeft size={22} />
        </button>
        {editing ? (
          <input
            className="title-field"
            value={draft}
            aria-label={text(lang, "bookName")}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveTitle();
              }
            }}
          />
        ) : (
          <button type="button" className="title-btn" onClick={() => setEditing(true)}>
            <strong>{book.title}</strong>
            <span>
              {page.title.trim() ? `${page.title.trim()} · ` : ""}
              {formatName(page.format)} · {paperName(page.paper)}
            </span>
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          aria-label={text(lang, "undo")}
          disabled={page.strokes.length === 0}
          onClick={() => undoStroke(book.id, page.id)}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={text(lang, "redo")}
          disabled={(redoMap[page.id]?.length ?? 0) === 0}
          onClick={() => redoStroke(book.id, page.id)}
        >
          <Redo2 size={18} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={reading ? text(lang, "write") : text(lang, "read")}
          aria-pressed={reading}
          onClick={() => setReading(!reading)}
        >
          {reading ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={text(lang, "menu")}
          onClick={() => setTray("menu")}
        >
          <MoreHorizontal size={20} />
        </button>
      </header>
      <div
        className="stage"
        ref={stageRef}
        onPointerDown={(event) => {
          if (!(tool === "text" || reading) || zoom > 1.05) return;
          gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
        }}
        onPointerUp={(event) => {
          const start = gesture.current;
          gesture.current = null;
          if (!start || start.id !== event.pointerId) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
          if (dx < 0 && index < book.pages.length - 1) setPageId(book.pages[index + 1].id);
          if (dx > 0 && index > 0) setPageId(book.pages[index - 1].id);
        }}
      >
        <div className="sheet-zoom" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
        <Paper
          key={page.id}
          page={page}
          tool={tool}
          ink={ink}
          penWidth={penWidth}
          reading={reading}
          onChange={(patch) => {
            if (patch.strokes) forgetRedo(page.id);
            updatePage(book.id, page.id, patch);
          }}
        />
        </div>
      </div>
      <footer className="dock">
        <div className="pager">
          <button
            type="button"
            className="pager-zoom"
            aria-label={text(lang, "zoom")}
            onClick={() => setZoom((value) => (value < 1.2 ? 1.4 : value < 1.7 ? 2 : 1))}
          >
            {zoom === 1 ? "1×" : `${zoom.toFixed(1)}×`}
          </button>
          <button type="button" aria-label={text(lang, "prev")} disabled={index === 0} onClick={() => setPageId(book.pages[index - 1].id)}>
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="pager-count"
            aria-label={text(lang, "contents")}
            onClick={() => {
              setPageDraft(page.title);
              setTray("pages");
            }}
          >
            {index + 1} / {book.pages.length}
          </button>
          <button
            type="button"
            aria-label={text(lang, "next")}
            disabled={index >= book.pages.length - 1}
            onClick={() => setPageId(book.pages[index + 1].id)}
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            aria-label={text(lang, "newPage")}
            onClick={() => addPage(book.id, { format: page.format, paper: page.paper })}
          >
            <Plus size={18} />
          </button>
        </div>
        {drawsInk(tool) ? (
          <div className="ink-row">
            <div className="sizes">
              {[1, 2, 3].map((size) => (
                <button
                  key={size}
                  type="button"
                  className="size-btn"
                  data-w={size}
                  data-on={penWidth === size ? "true" : "false"}
                  aria-label={size === 1 ? text(lang, "thin") : size === 2 ? text(lang, "mid") : text(lang, "thick")}
                  aria-pressed={penWidth === size}
                  onClick={() => setWidth(size as 1 | 2 | 3)}
                />
              ))}
            </div>
            {INKS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="swatch"
                data-ink={item.id}
                data-on={ink === item.id ? "true" : "false"}
                aria-label={inkName(item.id, lang)}
                aria-pressed={ink === item.id}
                onClick={() => setInk(item.id)}
              />
            ))}
          </div>
        ) : null}
        <div className="tools">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="tool"
                data-on={tool === item.id ? "true" : "false"}
                aria-pressed={tool === item.id}
                aria-label={text(lang, item.key)}
                title={text(lang, item.key)}
                onClick={() => setTool(item.id)}
              >
                <Icon size={18} /> {text(lang, item.key)}
              </button>
            );
          })}
          <button type="button" className="tool" aria-label={text(lang, "image")} title={text(lang, "image")} onClick={() => fileRef.current?.click()}>
            <Image size={18} /> {text(lang, "image")}
          </button>
          <button type="button" className="tool" aria-label={text(lang, "pageWord")} title={text(lang, "pageWord")} onClick={() => setTray("style")}>
            <span className="tool-chip" data-paper={page.paper} />
            {text(lang, "pageWord")}
          </button>
        </div>
        <input
          ref={fileRef}
          className="file-hidden"
          type="file"
          accept="image/*"
          aria-label={text(lang, "imageAdd")}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            void shrinkImage(file).then((src) => {
              const images = [...(page.images ?? []), { id: `im${Date.now().toString(36)}`, src, x: 0.12, y: 28, w: 0.76 }].slice(-6);
              updatePage(book.id, page.id, { images });
            });
          }}
        />
      </footer>
      {tray === "style" ? (
        <Overlay label={text(lang, "sheetForm")} onClose={() => setTray(null)}>
          <p className="section-label">{text(lang, "form")} · {formatName(page.format, lang)}</p>
          <FormatPicker
            value={page.format}
            paper={page.paper}
            onChange={(format: FormatId) => setPageStyle(book.id, page.id, format, page.paper)}
          />
          <p className="section-label">{text(lang, "color")} · {paperName(page.paper, lang)}</p>
          <PaperPicker
            value={page.paper}
            onChange={(paper: PaperId) => setPageStyle(book.id, page.id, page.format, paper)}
          />
          <p className="hint">{text(lang, "styleHint")}</p>
          <div className="menu-list">
            <button type="button" className="menu-btn" onClick={clearPage}>
              <Eraser size={18} /> {text(lang, "clear")}
            </button>
            <button
              type="button"
              className="menu-btn"
              onClick={() => {
                duplicatePage(book.id, page.id);
                setTray(null);
              }}
            >
              <Copy size={18} /> {text(lang, "dupPage")}
            </button>
            <button type="button" className="menu-btn" disabled={pageOut !== null} onClick={() => exportLive("pdf")}>
              <Share2 size={18} /> {pageOut === "pdf" ? text(lang, "pdfBusy") : text(lang, "pagePdf")}
            </button>
            <button type="button" className="menu-btn" disabled={pageOut !== null} onClick={() => exportLive("png")}>
              <Image size={18} /> {pageOut === "png" ? text(lang, "pdfBusy") : text(lang, "pageImage")}
            </button>
            {book.pages.length > 1 ? (
              <DeleteChoice
                label={text(lang, "delPage")}
                ask={text(lang, "delPageAsk")}
                yes={text(lang, "delYes")}
                no={text(lang, "delNo")}
                onYes={() => {
                  const neighbor = book.pages[index + 1] ?? book.pages[index - 1];
                  if (neighbor) setPageId(neighbor.id);
                  deletePage(book.id, page.id);
                  setTray(null);
                }}
              />
            ) : (
              <p className="hint">{text(lang, "last")}</p>
            )}
          </div>
        </Overlay>
      ) : null}
      {tray === "menu" ? (
        <Overlay label={text(lang, "book")} onClose={() => setTray(null)}>
          <input
            className="tray-title"
            value={draft}
            aria-label={text(lang, "bookName")}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => rename(book.id, draft)}
          />
          <p className="section-label">{text(lang, "cover")} · {coverName(book.cover, lang)}</p>
          <CoverPicker value={book.cover} onChange={(cover) => setCover(book.id, cover)} />
          <div className="menu-list">
            <button type="button" className="menu-btn" onClick={() => togglePin(book.id)}>
              <Pin size={18} /> {book.pinned ? text(lang, "unpin") : text(lang, "pin")}
            </button>
            <button
              type="button"
              className="menu-btn"
              onClick={() => {
                duplicate(book.id);
                setTray(null);
              }}
            >
              <Copy size={18} /> {text(lang, "copy")}
            </button>
            <button
              type="button"
              className="menu-btn"
              disabled={pdfOn}
              onClick={() => setPdfOn(true)}
            >
              <Share2 size={18} /> {pdfOn ? text(lang, "pdfBusy") : text(lang, "pdf")}
            </button>
            <DeleteChoice
              label={text(lang, "del")}
              ask={text(lang, "delAsk")}
              yes={text(lang, "delYes")}
              no={text(lang, "delNo")}
              onYes={() => remove(book.id)}
            />
          </div>
        </Overlay>
      ) : null}
      {tray === "pages" ? (
        <Overlay label={text(lang, "contents")} onClose={() => setTray(null)}>
          <input
            className="tray-title"
            value={pageDraft}
            placeholder={text(lang, "pageName")}
            aria-label={text(lang, "pageName")}
            onChange={(event) => {
              setPageDraft(event.target.value);
              updatePage(book.id, page.id, { title: event.target.value });
            }}
          />
          <p className="hint">{text(lang, "pageHint")}</p>
          <div className="toc">
            {book.pages.map((item, itemIndex) => (
              <div className="toc-row" data-on={item.id === page.id ? "true" : "false"} key={item.id}>
                <button
                  type="button"
                  className="toc-jump"
                  onClick={() => {
                    setPageId(item.id);
                    setPageDraft(item.title);
                    setTray(null);
                  }}
                >
                  <PageThumb page={item} />
                  <span className="toc-num">{itemIndex + 1}</span>
                  <span className="toc-copy">
                    <strong>{pageName(item, itemIndex, lang)}</strong>
                    <em>
                      {formatName(item.format, lang)} · {paperName(item.paper, lang)}
                    </em>
                  </span>
                </button>
                <div className="toc-ops">
                  <button
                    type="button"
                    aria-label={item.marked ? text(lang, "unmark") : text(lang, "mark")}
                    aria-pressed={item.marked}
                    data-on={item.marked ? "true" : "false"}
                    onClick={() => updatePage(book.id, item.id, { marked: !item.marked })}
                  >
                    <Bookmark size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={text(lang, "up")}
                    disabled={itemIndex === 0}
                    onClick={() => movePage(book.id, item.id, -1)}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={text(lang, "down")}
                    disabled={itemIndex === book.pages.length - 1}
                    onClick={() => movePage(book.id, item.id, 1)}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Overlay>
      ) : null}
      {pdfOn ? <PdfBook book={book} ink={ink} penWidth={penWidth} onDone={() => setPdfOn(false)} /> : null}
    </div>
  );
}
