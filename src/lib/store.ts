import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isLang, type Lang } from "@/lib/i18n";
import {
  blankHours,
  blankItem,
  blankPage,
  cloneNotebook,
  clonePage,
  COVERS,
  FORMATS,
  PAPERS,
  seedNotebooks,
  type CoverId,
  type FormatId,
  type InkId,
  type Notebook,
  type Page,
  type PaperId,
  type PenWidth,
  type Stroke,
  type Tool,
} from "@/lib/notebook";

export interface Defaults {
  cover: CoverId;
  format: FormatId;
  paper: PaperId;
}

interface State {
  notebooks: Notebook[];
  openId: string | null;
  tool: Tool;
  ink: InkId;
  penWidth: PenWidth;
  defaults: Defaults;
  lang: Lang;
  reading: boolean;
  redo: Record<string, Stroke[]>;
  open: (id: string, pageId?: string) => void;
  close: () => void;
  create: (input: { title: string; cover: CoverId; format: FormatId; paper: PaperId }) => void;
  remove: (id: string) => void;
  rename: (id: string, title: string) => void;
  duplicate: (id: string) => void;
  setCover: (id: string, cover: CoverId) => void;
  togglePin: (id: string) => void;
  setCursor: (id: string, cursor: number) => void;
  movePage: (notebookId: string, pageId: string, dir: -1 | 1) => void;
  setTool: (tool: Tool) => void;
  setInk: (ink: InkId) => void;
  setWidth: (width: PenWidth) => void;
  setReading: (reading: boolean) => void;
  forgetRedo: (pageId: string) => void;
  undoStroke: (notebookId: string, pageId: string) => void;
  redoStroke: (notebookId: string, pageId: string) => void;
  updatePage: (notebookId: string, pageId: string, patch: Partial<Page>) => void;
  setPageStyle: (notebookId: string, pageId: string, format: FormatId, paper: PaperId) => void;
  addPage: (notebookId: string, style?: { format: FormatId; paper: PaperId }) => void;
  duplicatePage: (notebookId: string, pageId: string) => void;
  deletePage: (notebookId: string, pageId: string) => void;
  setDefaults: (patch: Partial<Defaults>) => void;
  setLang: (lang: Lang) => void;
  replaceNotebooks: (notebooks: Notebook[]) => void;
  clearAll: () => void;
}

function touch(notebooks: Notebook[], id: string, map: (n: Notebook) => Notebook) {
  return notebooks.map((n) => (n.id === id ? map({ ...n, updatedAt: Date.now() }) : n));
}

const DEMO_IDS = new Set(seedNotebooks().map((n) => n.id));
const DEMO_STAMP = new Map(seedNotebooks().map((n) => [n.id, n.updatedAt]));
const DEMO_PAGES = new Set(seedNotebooks().flatMap((n) => n.pages.map((p) => p.id)));

/** Remove untouched demo notebooks and demo date labels left from 1.0.0/1.0.1. */
function stripDemo(list: Notebook[]): Notebook[] {
  return list
    .filter((n) => !(DEMO_IDS.has(n.id) && DEMO_STAMP.get(n.id) === n.updatedAt))
    .map((n) => ({
      ...n,
      pages: n.pages.map((p) => (DEMO_PAGES.has(p.id) ? { ...p, dateLabel: "" } : p)),
    }));
}

function revive(raw: Notebook): Notebook {
  const pages = (raw.pages ?? []).map((p) => ({
    ...p,
    title: p.title ?? "",
    marked: Boolean(p.marked),
    main: p.main ?? "",
    side: p.side ?? "",
    summary: p.summary ?? "",
    dateLabel: p.dateLabel ?? "",
    items: Array.isArray(p.items) ? p.items : [],
    hours: Array.isArray(p.hours) ? p.hours : [],
    strokes: Array.isArray(p.strokes) ? p.strokes : [],
    images: Array.isArray(p.images) ? p.images : [],
    notes: Array.isArray(p.notes) ? p.notes : [],
  }));
  const safe = pages.length ? pages : [blankPage(raw.format ?? "lined", raw.paper ?? "cream")];
  return {
    ...raw,
    pinned: Boolean(raw.pinned),
    cursor: Math.min(Math.max(raw.cursor ?? 0, 0), safe.length - 1),
    pages: safe,
  };
}

export const useBook = create<State>()(
  persist(
    (set) => ({
      notebooks: [],
      openId: null,
      tool: "text",
      ink: "ink",
      penWidth: 2,
      defaults: { cover: "lilac", format: "lined", paper: "cream" },
      lang: "az",
      reading: false,
      redo: {},
      open: (id, pageId) =>
        set((s) => {
          const book = s.notebooks.find((n) => n.id === id);
          const found = pageId ? book?.pages.findIndex((p) => p.id === pageId) ?? -1 : book?.cursor ?? 0;
          const cursor = found >= 0 ? found : 0;
          return {
            openId: id,
            tool: "text",
            reading: false,
            notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, cursor } : n)),
          };
        }),
      close: () => set({ openId: null, tool: "text", reading: false }),
      create: (input) => {
        const now = Date.now();
        const notebook: Notebook = {
          id: `nb-${now.toString(36)}`,
          title: input.title.trim() || "Adsız dəftər",
          cover: input.cover,
          format: input.format,
          paper: input.paper,
          pinned: false,
          cursor: 0,
          createdAt: now,
          updatedAt: now,
          pages: [blankPage(input.format, input.paper)],
        };
        set((s) => ({ notebooks: [notebook, ...s.notebooks], openId: notebook.id, tool: "text", reading: false }));
      },
      remove: (id) =>
        set((s) => ({
          notebooks: s.notebooks.filter((n) => n.id !== id),
          openId: s.openId === id ? null : s.openId,
        })),
      rename: (id, title) =>
        set((s) => ({
          notebooks: touch(s.notebooks, id, (n) => ({
            ...n,
            title: title.trim() || n.title,
          })),
        })),
      duplicate: (id) =>
        set((s) => {
          const found = s.notebooks.find((n) => n.id === id);
          if (!found) return s;
          const copy = cloneNotebook(found);
          return { notebooks: [copy, ...s.notebooks], openId: copy.id };
        }),
      setCover: (id, cover) =>
        set((s) => ({
          notebooks: touch(s.notebooks, id, (n) => ({ ...n, cover })),
        })),
      togglePin: (id) =>
        set((s) => ({
          notebooks: touch(s.notebooks, id, (n) => ({ ...n, pinned: !n.pinned })),
        })),
      setCursor: (id, cursor) =>
        set((s) => ({
          notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, cursor } : n)),
        })),
      movePage: (notebookId, pageId, dir) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => {
            const from = n.pages.findIndex((p) => p.id === pageId);
            const to = from + dir;
            if (from < 0 || to < 0 || to >= n.pages.length) return n;
            const pages = n.pages.slice();
            const [row] = pages.splice(from, 1);
            pages.splice(to, 0, row);
            return { ...n, pages };
          }),
        })),
      setTool: (tool) => set({ tool, reading: false }),
      setInk: (ink) => set({ ink }),
      setWidth: (penWidth) => set({ penWidth }),
      setReading: (reading) => set({ reading }),
      forgetRedo: (pageId) => set((s) => ({ redo: { ...s.redo, [pageId]: [] } })),
      undoStroke: (notebookId, pageId) =>
        set((s) => {
          const book = s.notebooks.find((n) => n.id === notebookId);
          const page = book?.pages.find((p) => p.id === pageId);
          const last = page?.strokes[page.strokes.length - 1];
          if (!book || !page || !last) return s;
          return {
            notebooks: touch(s.notebooks, notebookId, (n) => ({
              ...n,
              pages: n.pages.map((p) => (p.id === pageId ? { ...p, strokes: p.strokes.slice(0, -1) } : p)),
            })),
            redo: { ...s.redo, [pageId]: [...(s.redo[pageId] ?? []), last] },
          };
        }),
      redoStroke: (notebookId, pageId) =>
        set((s) => {
          const stack = s.redo[pageId] ?? [];
          const last = stack[stack.length - 1];
          if (!last) return s;
          return {
            notebooks: touch(s.notebooks, notebookId, (n) => ({
              ...n,
              pages: n.pages.map((p) =>
                p.id === pageId ? { ...p, strokes: [...p.strokes, last].slice(-160) } : p,
              ),
            })),
            redo: { ...s.redo, [pageId]: stack.slice(0, -1) },
          };
        }),
      updatePage: (notebookId, pageId, patch) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => ({
            ...n,
            pages: n.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
          })),
        })),
      setPageStyle: (notebookId, pageId, format, paper) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => ({
            ...n,
            format,
            paper,
            pages: n.pages.map((p) => {
              if (p.id !== pageId) return p;
              return {
                ...p,
                format,
                paper,
                items: format === "checklist" && p.items.length === 0 ? [blankItem(), blankItem(), blankItem()] : p.items,
                hours: format === "planner" && p.hours.length === 0 ? blankHours() : p.hours,
                dateLabel: format === "journal" && !p.dateLabel ? blankPage("journal", paper).dateLabel : p.dateLabel,
              };
            }),
          })),
        })),
      addPage: (notebookId, style) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => {
            const format = style?.format ?? n.format;
            const paper = style?.paper ?? n.paper;
            return {
              ...n,
              format,
              paper,
              cursor: n.pages.length,
              pages: [...n.pages, blankPage(format, paper)],
            };
          }),
        })),
      duplicatePage: (notebookId, pageId) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => {
            const index = n.pages.findIndex((p) => p.id === pageId);
            if (index < 0) return n;
            const pages = n.pages.slice();
            pages.splice(index + 1, 0, clonePage(n.pages[index]));
            return { ...n, pages, cursor: index + 1 };
          }),
        })),
      deletePage: (notebookId, pageId) =>
        set((s) => ({
          notebooks: touch(s.notebooks, notebookId, (n) => {
            const pages = n.pages.filter((p) => p.id !== pageId);
            return { ...n, pages: pages.length ? pages : [blankPage(n.format, n.paper)] };
          }),
        })),
      setDefaults: (patch) => set((s) => ({ defaults: { ...s.defaults, ...patch } })),
      setLang: (lang) => set({ lang }),
      replaceNotebooks: (notebooks) =>
        set({
          notebooks: notebooks.map((notebook) => revive(notebook)),
          openId: null,
          reading: false,
          redo: {},
        }),
      clearAll: () => set({ notebooks: [], openId: null, reading: false }),
    }),
    {
      name: "vereq-notebooks-v1",
      partialize: (s) => ({
        notebooks: s.notebooks,
        ink: s.ink,
        tool: s.tool,
        penWidth: s.penWidth,
        defaults: s.defaults,
        lang: s.lang,
      }),
      merge: (persisted, current) => {
        const saved = persisted as
          | Partial<Pick<State, "notebooks" | "ink" | "tool" | "penWidth" | "defaults" | "lang">>
          | undefined;
        if (!saved || !Array.isArray(saved.notebooks)) return current;
        const width = saved.penWidth;
        const defaults = saved.defaults;
        const cover = defaults && COVERS.some((item) => item.id === defaults.cover) ? defaults.cover : current.defaults.cover;
        const format = defaults && FORMATS.some((item) => item.id === defaults.format) ? defaults.format : current.defaults.format;
        const paper = defaults && PAPERS.some((item) => item.id === defaults.paper) ? defaults.paper : current.defaults.paper;
        return {
          ...current,
          notebooks: stripDemo(saved.notebooks.map((notebook) => revive(notebook as Notebook))),
          ink: saved.ink ?? current.ink,
          tool: saved.tool ?? current.tool,
          penWidth: width === 1 || width === 2 || width === 3 ? width : current.penWidth,
          defaults: { cover, format, paper },
          lang: isLang(saved.lang) ? saved.lang : current.lang,
          reading: false,
          redo: {},
          openId: null,
        };
      },
    },
  ),
);
