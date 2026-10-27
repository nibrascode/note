import { useEffect, useState } from "react";
import { Copy, LayoutGrid, MoreVertical, Pin, Plus, Search, Settings as SettingsIcon, Share2, X } from "lucide-react";
import mark from "@/assets/mark.jpg";
import { coverName, findSnippet, formatName, pagePlain, whenLabel, type CoverId, type FormatId, type PaperId } from "@/lib/notebook";
import { LANGS, notebookCount, text } from "@/lib/i18n";
import { useBook } from "@/lib/store";
import { CoverPicker, DeleteChoice, FormatPicker, Overlay, PaperPicker } from "@/components/vereq/bits";
import { LangPicker, Privacy, Settings } from "@/components/vereq/settings";
import { PdfBook } from "@/components/vereq/pdf-book";

export function Shelf() {
  const notebooks = useBook((s) => s.notebooks);
  const open = useBook((s) => s.open);
  const create = useBook((s) => s.create);
  const rename = useBook((s) => s.rename);
  const duplicate = useBook((s) => s.duplicate);
  const remove = useBook((s) => s.remove);
  const togglePin = useBook((s) => s.togglePin);
  const defaults = useBook((s) => s.defaults);
  const lang = useBook((s) => s.lang);
  const ink = useBook((s) => s.ink);
  const penWidth = useBook((s) => s.penWidth);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pane, setPane] = useState<"docs" | "search">("docs");
  const [screen, setScreen] = useState<null | "settings" | "privacy">(null);
  const [langOpen, setLangOpen] = useState(false);
  const [sort, setSort] = useState<"date" | "type" | "name">("date");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<CoverId>("lilac");
  const [format, setFormat] = useState<FormatId>("lined");
  const [paper, setPaper] = useState<PaperId>("cream");

  useEffect(() => {
    if (!creating) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCreating(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [creating]);

  const q = query.trim().toLocaleLowerCase("az");
  const sorted = [...notebooks].sort((a, b) => {
    const pin = Number(b.pinned) - Number(a.pinned);
    if (pin) return pin;
    if (sort === "name") return a.title.localeCompare(b.title, "az");
    if (sort === "type") return formatName(a.format).localeCompare(formatName(b.format), "az") || b.updatedAt - a.updatedAt;
    return b.updatedAt - a.updatedAt;
  });
  const hits = q
    ? sorted.flatMap((notebook) => {
        const pages = notebook.pages.flatMap((page, index) => {
          const plain = pagePlain(page);
          if (!plain.toLocaleLowerCase("az").includes(q)) return [];
          return [{ pageId: page.id, excerpt: findSnippet(plain, query.trim()), index }];
        });
        if (pages.length) return pages.map((page) => ({ notebook, ...page }));
        if (notebook.title.toLocaleLowerCase("az").includes(q)) {
          return [{ notebook, pageId: undefined as string | undefined, excerpt: `${notebook.pages.length} vərəq`, index: notebook.cursor }];
        }
        return [];
      })
    : [];

  const count = notebookCount(notebooks.length, lang);
  const tx = (key: Parameters<typeof text>[1]) => text(lang, key);

  if (screen === "privacy") return <Privacy onClose={() => setScreen("settings")} />;
  if (screen === "settings") return <Settings onClose={() => setScreen(null)} onPrivacy={() => setScreen("privacy")} />;

  return (
    <div className="device">
      <header className="masthead">
        <div className="brand">
          <img className="mark" src={mark} alt="" />
          <div>
            <h1 className="wordmark">Nibras Note</h1>
            <p className="tagline">{count} · {tx("tag")}</p>
          </div>
          <button type="button" className="lang-pill" aria-label={tx("langTitle")} onClick={() => setLangOpen(true)}>
            {LANGS.find((item) => item.id === lang)?.short}
          </button>
          <button type="button" className="icon-btn settings-gear" aria-label={tx("settings")} onClick={() => setScreen("settings")}>
            <SettingsIcon size={20} />
          </button>
        </div>
        {pane === "search" ? (
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tx("searchPh")}
              aria-label={tx("searchPh")}
              autoFocus
            />
            {query ? (
              <button type="button" className="icon-plain" aria-label={tx("searchClear")} onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            ) : null}
          </label>
        ) : (
          <div className="sorts" role="tablist" aria-label={tx("sort")}>
            {(
              [
                ["date", tx("sortDate")],
                ["type", tx("sortType")],
                ["name", tx("sortName")],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={sort === id} data-on={sort === id ? "true" : "false"} onClick={() => setSort(id)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </header>
      <div className="shelf-scroll">
        {pane === "search" ? (
          !q ? (
            <div className="empty">
              <img className="mark" src={mark} alt="" />
              <p>{tx("emptyQuery")}</p>
            </div>
          ) : hits.length === 0 ? (
            <div className="empty">
              <img className="mark" src={mark} alt="" />
              <p>{tx("emptyNone")}</p>
            </div>
          ) : (
            <div className="hits">
              {hits.map((hit) => (
                <button
                  key={`${hit.notebook.id}-${hit.pageId ?? "book"}`}
                  type="button"
                  className="hit"
                  onClick={() => open(hit.notebook.id, hit.pageId)}
                >
                  <span className="hit-chip" data-cover={hit.notebook.cover} />
                  <span>
                    <strong>{hit.notebook.title}</strong>
                    <em>
                      {hit.pageId ? `${hit.index + 1}. ` : ""}
                      {hit.excerpt}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          )
        ) : sorted.length === 0 ? (
          <div className="empty">
            <img className="mark" src={mark} alt="" />
            <p>{tx("emptyFirst")}</p>
          </div>
        ) : (
          <div className="doc-grid">
            {sorted.map((notebook) => {
              const face = notebook.pages[notebook.cursor] ?? notebook.pages[0];
              return (
                <article className="doc" key={notebook.id}>
                  <button
                    type="button"
                    className="bound"
                    data-cover={notebook.cover}
                    aria-label={notebook.title}
                    onClick={() => open(notebook.id)}
                  >
                    <span className="bound-spine" />
                    <span className="bound-pages" data-paper={face?.paper ?? notebook.paper} />
                    {notebook.pinned ? <span className="bound-ribbon" /> : null}
                    <span className="bound-copy">
                      <strong>{notebook.title}</strong>
                      <em className="bound-when">{whenLabel(notebook.updatedAt, lang)}</em>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="doc-menu"
                    aria-label={tx("menu")}
                    onClick={() => setMenuId(notebook.id)}
                  >
                    <MoreVertical size={14} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
        <p className="foot-note">{tx("foot")}</p>
      </div>
      <nav className="library-bar">
        <button type="button" className="library-tab" data-on={pane === "docs" ? "true" : "false"} onClick={() => setPane("docs")}>
          <LayoutGrid size={18} /> {tx("docs")}
        </button>
        <button
          type="button"
          className="library-plus"
          aria-label={tx("newBook")}
          onClick={() => {
            setCover(defaults.cover);
            setFormat(defaults.format);
            setPaper(defaults.paper);
            setCreating(true);
          }}
        >
          <Plus size={22} />
        </button>
        <button type="button" className="library-tab" data-on={pane === "search" ? "true" : "false"} onClick={() => setPane("search")}>
          <Search size={18} /> {tx("search")}
        </button>
      </nav>
      {creating ? (
        <Overlay label={tx("newBook")} onClose={() => setCreating(false)}>
          <div className="bound bound-hero" data-cover={cover}>
            <span className="bound-spine" />
            <span className="bound-pages" data-paper={paper} />
            <span className="bound-copy">
              <span className="kicker">{coverName(cover, lang)}</span>
              <strong>{title.trim() || tx("untitled")}</strong>
            </span>
          </div>
          <input
            className="tray-title"
            value={title}
            autoFocus
            placeholder={tx("bookName")}
            aria-label={tx("bookName")}
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="section-label">{tx("cover")} · {coverName(cover, lang)}</p>
          <CoverPicker value={cover} onChange={setCover} />
          <p className="section-label">{tx("sheetForm")} · {formatName(format, lang)}</p>
          <FormatPicker value={format} paper={paper} onChange={setFormat} />
          <p className="section-label">{tx("paper")}</p>
          <PaperPicker value={paper} onChange={setPaper} />
          <button
            type="button"
            className="primary"
            onClick={() => {
              create({ title, cover, format, paper });
              setTitle("");
              setCreating(false);
            }}
          >
            {tx("newBook")}
          </button>
        </Overlay>
      ) : null}
      {(() => {
        const menu = notebooks.find((item) => item.id === menuId);
        if (!menu) return null;
        return (
          <Overlay
            label={tx("book")}
            onClose={() => setMenuId(null)}
          >
            <input
              className="tray-title"
              defaultValue={menu.title}
              key={menu.id}
              aria-label={tx("bookName")}
              onBlur={(event) => rename(menu.id, event.target.value)}
            />
            <p className="doc-when">{whenLabel(menu.updatedAt, lang)} · {menu.pages.length} {tx("pages")}</p>
            <div className="menu-list">
              <button type="button" className="menu-btn" onClick={() => togglePin(menu.id)}>
                <Pin size={18} /> {menu.pinned ? tx("unpin") : tx("pin")}
              </button>
              <button
                type="button"
                className="menu-btn"
                onClick={() => {
                  duplicate(menu.id);
                  setMenuId(null);
                }}
              >
                <Copy size={18} /> {tx("copy")}
              </button>
              <button type="button" className="menu-btn" disabled={pdfId === menu.id} onClick={() => setPdfId(menu.id)}>
                <Share2 size={18} /> {pdfId === menu.id ? tx("pdfBusy") : tx("pdf")}
              </button>
              <DeleteChoice
                label={tx("del")}
                ask={tx("delAsk")}
                yes={tx("delYes")}
                no={tx("delNo")}
                onYes={() => {
                  remove(menu.id);
                  setMenuId(null);
                }}
              />
            </div>
          </Overlay>
        );
      })()}
      {langOpen ? (
        <Overlay label={tx("langTitle")} onClose={() => setLangOpen(false)}>
          <p className="section-label">{tx("langTitle")}</p>
          <p className="set-lead">{tx("langLead")}</p>
          <LangPicker />
        </Overlay>
      ) : null}
      {(() => {
        const pdfBook = notebooks.find((item) => item.id === pdfId);
        if (!pdfBook) return null;
        return <PdfBook book={pdfBook} ink={ink} penWidth={penWidth} onDone={() => setPdfId(null)} />;
      })()}
    </div>
  );
}
