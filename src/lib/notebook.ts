import { text, type Lang } from "@/lib/i18n";

export const FORMATS = [
  { id: "lined", name: "Xətti", hint: "Klassik dəftər" },
  { id: "narrow", name: "Dar xətt", hint: "Sıx yazı" },
  { id: "wide", name: "Geniş xətt", hint: "İri əl yazısı" },
  { id: "grid", name: "Xana", hint: "Qrafik" },
  { id: "dots", name: "Nöqtə", hint: "Sərbəst plan" },
  { id: "blank", name: "Boş", hint: "Məktub" },
  { id: "cornell", name: "Cornell", hint: "Qeyd üsulu" },
  { id: "checklist", name: "Siyahı", hint: "İşarələ" },
  { id: "journal", name: "Gündəlik", hint: "Tarixli səhifə" },
  { id: "planner", name: "Planer", hint: "Saat-saat" },
  { id: "columns", name: "İki sütun", hint: "Yan-yana" },
  { id: "margin", name: "Haşiyə", hint: "Kənar qeyd" },
] as const;

export const PAPERS = [
  { id: "cream", name: "Krem" },
  { id: "ivory", name: "Fil sümüyü" },
  { id: "white", name: "Ağ" },
  { id: "lemon", name: "Limon" },
  { id: "peach", name: "Şaftalı" },
  { id: "blush", name: "Çəhrayı" },
  { id: "lavender", name: "Lavanda" },
  { id: "sky", name: "Göy" },
  { id: "mint", name: "Nanə" },
  { id: "kraft", name: "Kraft" },
  { id: "night", name: "Gecə" },
] as const;

export const COVERS = [
  { id: "lilac", name: "Yasəmən" },
  { id: "violet", name: "Bənövşə" },
  { id: "ink", name: "Mürəkkəb" },
  { id: "navy", name: "Gecə göyü" },
  { id: "coral", name: "Mərcan" },
  { id: "blush", name: "Gül" },
  { id: "mint", name: "Nanə" },
  { id: "lime", name: "Laym" },
  { id: "slate", name: "Şifer" },
  { id: "sand", name: "Qum" },
  { id: "wine", name: "Şərab" },
  { id: "ocean", name: "Okean" },
  { id: "leather", name: "Dəri" },
  { id: "linen", name: "Kətan" },
  { id: "marble", name: "Mərmər" },
  { id: "velvet", name: "Məxmər" },
  { id: "forest", name: "Meşə" },
  { id: "denim", name: "Cin" },
  { id: "pearl", name: "Mirvari" },
  { id: "terra", name: "Gil" },
] as const;

export const INKS = [
  { id: "ink", name: "Mürəkkəb" },
  { id: "gold", name: "Qızıl" },
  { id: "ruby", name: "Yaqut" },
  { id: "emerald", name: "Zümrüd" },
  { id: "lagoon", name: "Lagun" },
  { id: "violet", name: "Bənövşə" },
  { id: "plum", name: "Gavalı" },
  { id: "coral", name: "Mərcan" },
  { id: "copper", name: "Mis" },
  { id: "navy", name: "Göy" },
  { id: "mint", name: "Nanə" },
  { id: "neon", name: "Neon" },
  { id: "brown", name: "Sepiya" },
  { id: "chalk", name: "Təbaşir" },
] as const;

export const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
] as const;

export type FormatId = (typeof FORMATS)[number]["id"];
export type PaperId = (typeof PAPERS)[number]["id"];
export type CoverId = (typeof COVERS)[number]["id"];
export type InkId = (typeof INKS)[number]["id"];
export type Tool =
  | "text"
  | "pen"
  | "pencil"
  | "fountain"
  | "marker"
  | "brush"
  | "gel"
  | "nib"
  | "eraser"
  | "line"
  | "rect"
  | "ellipse"
  | "star"
  | "arrow"
  | "check"
  | "move";
export type PenWidth = 1 | 2 | 3;
export type ShapeKind = "line" | "rect" | "ellipse" | "star" | "arrow" | "check";

export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
}

export interface HourSlot {
  label: string;
  text: string;
}

export interface Stroke {
  id: string;
  tool: "pen" | "pencil" | "fountain" | "marker" | "brush" | "gel" | "nib" | "shape";
  shape?: ShapeKind;
  ink: InkId;
  width: number;
  points: { x: number; y: number }[];
}

export interface PageImage {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
}

export interface PageNote {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
}

export interface Page {
  id: string;
  format: FormatId;
  paper: PaperId;
  title: string;
  marked: boolean;
  main: string;
  side: string;
  summary: string;
  items: CheckItem[];
  hours: HourSlot[];
  dateLabel: string;
  strokes: Stroke[];
  images: PageImage[];
  notes: PageNote[];
}

export interface Notebook {
  id: string;
  title: string;
  cover: CoverId;
  format: FormatId;
  paper: PaperId;
  pinned: boolean;
  cursor: number;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
}

const DAYS = ["bazar", "bazar ertəsi", "çərşənbə axşamı", "çərşənbə", "cümə axşamı", "cümə", "şənbə"];
const MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

export function todayLabel(d = new Date()) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${DAYS[d.getDay()]}`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const fmtKey = {
  lined: "fmtLined",
  narrow: "fmtNarrow",
  wide: "fmtWide",
  grid: "fmtGrid",
  dots: "fmtDots",
  blank: "fmtBlank",
  cornell: "fmtCornell",
  checklist: "fmtChecklist",
  journal: "fmtJournal",
  planner: "fmtPlanner",
  columns: "fmtColumns",
  margin: "fmtMargin",
} as const;

const paperKey = {
  cream: "paperCream",
  ivory: "paperIvory",
  white: "paperWhite",
  lemon: "paperLemon",
  peach: "paperPeach",
  blush: "paperBlush",
  lavender: "paperLavender",
  sky: "paperSky",
  mint: "paperMint",
  kraft: "paperKraft",
  night: "paperNight",
} as const;

const coverKey = {
  lilac: "coverLilac",
  violet: "coverViolet",
  ink: "coverInk",
  navy: "coverNavy",
  coral: "coverCoral",
  blush: "coverBlush",
  mint: "coverMint",
  lime: "coverLime",
  slate: "coverSlate",
  sand: "coverSand",
  wine: "coverWine",
  ocean: "coverOcean",
  leather: "coverLeather",
  linen: "coverLinen",
  marble: "coverMarble",
  velvet: "coverVelvet",
  forest: "coverForest",
  denim: "coverDenim",
  pearl: "coverPearl",
  terra: "coverTerra",
} as const;

const inkKey = {
  ink: "inkInk",
  violet: "inkViolet",
  coral: "inkCoral",
  navy: "inkNavy",
  mint: "inkMint",
  brown: "inkBrown",
  gold: "inkGold",
  ruby: "inkRuby",
  emerald: "inkEmerald",
  lagoon: "inkLagoon",
  plum: "inkPlum",
  copper: "inkCopper",
  neon: "inkNeon",
  chalk: "inkChalk",
} as const;

export function formatName(id: FormatId, lang: Lang = "az") {
  return text(lang, fmtKey[id]);
}

export function paperName(id: PaperId, lang: Lang = "az") {
  return text(lang, paperKey[id]);
}

export function coverName(id: CoverId, lang: Lang = "az") {
  return text(lang, coverKey[id]);
}

export function inkName(id: InkId, lang: Lang = "az") {
  return text(lang, inkKey[id]);
}

export function paperFill(paper: PaperId) {
  if (paper === "ivory") return "#fbf6ea";
  if (paper === "white") return "#f7f9fc";
  if (paper === "lemon") return "#fff4a8";
  if (paper === "peach") return "#ffd8c2";
  if (paper === "blush") return "#ffd4de";
  if (paper === "lavender") return "#e4d6ff";
  if (paper === "sky") return "#d5ebff";
  if (paper === "mint") return "#cff6e4";
  if (paper === "kraft") return "#e8cfa6";
  if (paper === "night") return "#1b1824";
  return "#f6ecd8";
}

const DAY_INK = {
  ink: "#2a241c",
  violet: "#6a45b0",
  coral: "#d4536a",
  navy: "#2c4f93",
  mint: "#0f7f76",
  brown: "#7a4b2e",
  gold: "#a97812",
  ruby: "#9b1638",
  emerald: "#0c7a4b",
  lagoon: "#0f6e8a",
  plum: "#7a2468",
  copper: "#b85c38",
  neon: "#d10eb8",
  chalk: "#6e675c",
} as const;

const NIGHT_INK = {
  ink: "#f3ecdf",
  violet: "#d2b8ff",
  coral: "#ffb1b6",
  navy: "#a9c0f5",
  mint: "#9cf0e4",
  brown: "#e4b48a",
  gold: "#ffe08a",
  ruby: "#ff8aa8",
  emerald: "#7dffd0",
  lagoon: "#8eebff",
  plum: "#f0b0e6",
  copper: "#ffc2a4",
  neon: "#ff5af2",
  chalk: "#f7f3ea",
} as const;

export function inkHex(ink: InkId, paper: PaperId) {
  return paper === "night" ? NIGHT_INK[ink] : DAY_INK[ink];
}

export function blankItem(): CheckItem {
  return { id: uid(), text: "", done: false };
}

export function blankHours(): HourSlot[] {
  return HOURS.map((label) => ({ label, text: "" }));
}

export function blankPage(format: FormatId, paper: PaperId, date = todayLabel()): Page {
  return {
    id: uid(),
    format,
    paper,
    title: "",
    marked: false,
    main: "",
    side: "",
    summary: "",
    items: format === "checklist" ? [blankItem(), blankItem(), blankItem()] : [],
    hours: format === "planner" ? blankHours() : [],
    dateLabel: format === "journal" ? date : "",
    strokes: [],
    images: [],
    notes: [],
  };
}

export function placeholderFor(format: FormatId, lang: Lang = "az") {
  if (format === "journal") return text(lang, "phJournal");
  if (format === "blank") return text(lang, "phBlank");
  if (format === "dots") return text(lang, "phDots");
  if (format === "grid") return text(lang, "phGrid");
  if (format === "wide") return text(lang, "phWide");
  return text(lang, "phWrite");
}

function page(partial: Partial<Page> & Pick<Page, "id" | "format" | "paper">): Page {
  return {
    title: "",
    marked: false,
    main: "",
    side: "",
    summary: "",
    items: [],
    hours: [],
    dateLabel: "",
    strokes: [],
    images: [],
    notes: [],
    ...partial,
  };
}

export function pagePlain(page: Page) {
  return [
    page.title,
    page.dateLabel,
    page.main,
    page.side,
    page.summary,
    ...page.items.map((item) => item.text),
    ...page.hours.map((hour) => hour.text),
    ...(page.notes ?? []).map((note) => note.text),
  ]
    .filter(Boolean)
    .join("\n");
}

export function pageName(page: Page, index: number, lang: Lang = "az") {
  const title = page.title?.trim();
  if (title) return title;
  if (page.dateLabel) return page.dateLabel;
  const line = pagePlain(page)
    .split("\n")
    .map((row) => row.trim())
    .find(Boolean);
  if (!line) return `${text(lang, "pageWord")} ${index + 1}`;
  return line.length > 42 ? `${line.slice(0, 40)}…` : line;
}

export function whenLabel(ts: number, lang: Lang = "az") {
  const date = new Date(ts);
  const locale = lang === "az" ? "az-AZ" : lang;
  const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${month}, ${hh}:${mm}`;
}

export function drawsInk(tool: Tool) {
  return tool !== "text" && tool !== "eraser" && tool !== "move";
}

export function findSnippet(text: string, query: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  const q = query.trim().toLocaleLowerCase("az");
  const i = flat.toLocaleLowerCase("az").indexOf(q);
  if (i < 0) return flat.slice(0, 80);
  const start = Math.max(0, i - 16);
  const end = Math.min(flat.length, i + q.length + 36);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}

export function seedNotebooks(): Notebook[] {
  const t = 1_761_436_800_000;
  return [
    {
      id: "nb-morning",
      title: "Səhər dəftəri",
      cover: "lilac",
      format: "journal",
      paper: "cream",
      pinned: true,
      cursor: 0,
      createdAt: t,
      updatedAt: t + 80_000,
      pages: [
        page({
          id: "p-morning-1",
          format: "journal",
          paper: "cream",
          marked: true,
          dateLabel: "26 oktyabr, bazar ertəsi",
          main: "Bu səhər yavaşdır — və bu, yaxşıdır.\n\nÜç şey günü daşıyır:\ntələsməmək, bir səhifəni sonadək yazmaq,\naxşam işığı sönməmiş bir qeyd buraxmaq.\n\nPəncərənin yanında çay. Qələm solda.\nUlduz isə yalnız bitirdiyim sətrin üstündə yanır.",
        }),
        page({
          id: "p-morning-2",
          format: "journal",
          paper: "lavender",
          dateLabel: "25 oktyabr, bazar",
          main: "Dünənki sətir yarımçıq qaldı.\nBu gün onu bitirmək kifayətdir.",
        }),
      ],
    },
    {
      id: "nb-studio",
      title: "Studio qeydləri",
      cover: "navy",
      format: "cornell",
      paper: "ivory",
      pinned: false,
      cursor: 0,
      createdAt: t,
      updatedAt: t + 60_000,
      pages: [
        page({
          id: "p-studio-1",
          format: "cornell",
          paper: "ivory",
          side: "Üz\nVərəq\nİşarə",
          main: "Yasəmən qabıq, krem vərəq.\nXətlər isti, kənar xətt mərcan.\nTamamlanmış iş nanə rəngindədir.\n\nQələm qara, ucu bənövşəyi.",
          summary: "Sakit fon, bir vurğu, çox vərəq.",
        }),
      ],
    },
    {
      id: "nb-market",
      title: "Bazar siyahısı",
      cover: "coral",
      format: "checklist",
      paper: "lemon",
      pinned: false,
      cursor: 0,
      createdAt: t,
      updatedAt: t + 40_000,
      pages: [
        page({
          id: "p-market-1",
          format: "checklist",
          paper: "lemon",
          items: [
            { id: "i1", text: "Süd", done: true },
            { id: "i2", text: "Kənd çörəyi", done: true },
            { id: "i3", text: "Limon", done: false },
            { id: "i4", text: "Yaşıl çay", done: false },
            { id: "i5", text: "Bal", done: false },
            { id: "i6", text: "Yumşaq qələm", done: false },
          ],
        }),
      ],
    },
    {
      id: "nb-week",
      title: "Həftənin axını",
      cover: "mint",
      format: "planner",
      paper: "blush",
      pinned: false,
      cursor: 0,
      createdAt: t,
      updatedAt: t + 20_000,
      pages: [
        page({
          id: "p-week-1",
          format: "planner",
          paper: "blush",
          hours: HOURS.map((label) => ({
            label,
            text:
              label === "07:00"
                ? "Səhər səhifəsi"
                : label === "09:00"
                  ? "Studio"
                  : label === "13:00"
                    ? "Bazara en"
                    : label === "18:00"
                      ? "Qısa qeyd"
                      : "",
          })),
        }),
      ],
    },
    {
      id: "nb-sketch",
      title: "Eskizlər",
      cover: "violet",
      format: "dots",
      paper: "white",
      pinned: false,
      cursor: 0,
      createdAt: t,
      updatedAt: t + 10_000,
      pages: [
        page({
          id: "p-sketch-1",
          format: "dots",
          paper: "white",
          main: "Nöqtələrin arasından keç.\nAşağıdan qələmi seç — xətt sərbəst qalır.",
        }),
        page({
          id: "p-sketch-2",
          format: "blank",
          paper: "night",
          main: "",
        }),
      ],
    },
  ];
}

export function clonePage(page: Page): Page {
  return {
    ...page,
    id: uid(),
    title: page.title.trim() ? `${page.title.trim()} nüsxə` : "",
    items: page.items.map((item) => ({ ...item, id: uid() })),
    hours: page.hours.map((hour) => ({ ...hour })),
    strokes: page.strokes.map((stroke) => ({
      ...stroke,
      width: stroke.width || 2,
      id: uid(),
      points: stroke.points.map((pt) => ({ ...pt })),
    })),
    images: (page.images ?? []).map((image) => ({ ...image, id: uid() })),
    notes: (page.notes ?? []).map((note) => ({ ...note, id: uid() })),
  };
}

export function cloneNotebook(n: Notebook): Notebook {
  const now = Date.now();
  return {
    ...n,
    id: uid(),
    title: `${n.title} nüsxəsi`,
    pinned: false,
    cursor: 0,
    createdAt: now,
    updatedAt: now,
    pages: n.pages.map((p) => ({
      ...p,
      id: uid(),
      items: p.items.map((item) => ({ ...item, id: uid() })),
      hours: p.hours.map((hour) => ({ ...hour })),
      strokes: p.strokes.map((stroke) => ({
        ...stroke,
        width: stroke.width || 2,
        id: uid(),
        points: stroke.points.map((pt) => ({ ...pt })),
      })),
      images: (p.images ?? []).map((image) => ({ ...image, id: uid() })),
      notes: (p.notes ?? []).map((note) => ({ ...note, id: uid() })),
    })),
  };
}
