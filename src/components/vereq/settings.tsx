import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Shield, Upload } from "lucide-react";
import { CoverPicker, DeleteChoice, FormatPicker, Overlay, PaperPicker } from "@/components/vereq/bits";
import { downloadBackup, parseBackup } from "@/lib/backup";
import { coverName, formatName, paperName, type FormatId, type PaperId } from "@/lib/notebook";
import { LANGS, notebookCount, text } from "@/lib/i18n";
import { useBook } from "@/lib/store";

export function LangPicker({ onDone }: { onDone?: () => void }) {
  const lang = useBook((s) => s.lang);
  const setLang = useBook((s) => s.setLang);
  return (
    <div className="lang-grid" role="listbox" aria-label={text(lang, "langTitle")}>
      {LANGS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="lang-opt"
          role="option"
          aria-selected={lang === item.id}
          data-on={lang === item.id ? "true" : "false"}
          onClick={() => {
            setLang(item.id);
            onDone?.();
          }}
        >
          <strong>{item.label}</strong>
          <span>{item.short}</span>
        </button>
      ))}
    </div>
  );
}

export function Settings({ onClose, onPrivacy }: { onClose: () => void; onPrivacy: () => void }) {
  const defaults = useBook((s) => s.defaults);
  const notebooks = useBook((s) => s.notebooks);
  const setDefaults = useBook((s) => s.setDefaults);
  const clearAll = useBook((s) => s.clearAll);
  const replaceNotebooks = useBook((s) => s.replaceNotebooks);
  const lang = useBook((s) => s.lang);
  const [backupNote, setBackupNote] = useState<"" | "ok" | "bad">("");
  const [langOpen, setLangOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const count = notebookCount(notebooks.length, lang);
  const current = LANGS.find((item) => item.id === lang) ?? LANGS[0];

  return (
    <div className="device">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label={text(lang, "back")} onClick={onClose}>
          <ChevronLeft size={22} />
        </button>
        <div className="title-btn">
          <strong>{text(lang, "settings")}</strong>
          <span>{text(lang, "phone")}</span>
        </div>
      </header>
      <div className="settings">
        <section className="set-card">
          <p className="section-label">{text(lang, "langTitle")}</p>
          <button type="button" className="set-row" onClick={() => setLangOpen(true)}>
            <span className="set-copy">
              <strong>{current.label}</strong>
              <span>{text(lang, "langLead")}</span>
            </span>
            <span className="lang-code">{current.short}</span>
            <ChevronRight size={18} />
          </button>
        </section>

        <section className="set-card">
          <p className="section-label">{text(lang, "privacy")}</p>
          <button type="button" className="set-row" onClick={onPrivacy}>
            <Shield size={18} />
            <span className="set-copy">
              <strong>{text(lang, "policy")}</strong>
              <span>{text(lang, "policyHint")}</span>
            </span>
            <ChevronRight size={18} />
          </button>
        </section>

        <section className="set-card">
          <p className="section-label">{text(lang, "memory")}</p>
          <div className="set-row" role="group">
            <span className="set-copy">
              <strong>{count}</strong>
              <span>{text(lang, "local")}</span>
            </span>
          </div>
          <p className="section-label">{text(lang, "backup")}</p>
          <p className="set-lead">{text(lang, "backupLead")}</p>
          <button type="button" className="menu-btn" onClick={() => downloadBackup(notebooks)}>
            <Download size={18} /> {text(lang, "backupSave")}
          </button>
          <button type="button" className="menu-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> {text(lang, "backupLoad")}
          </button>
          {backupNote ? <p className="hint">{text(lang, backupNote === "ok" ? "backupOk" : "backupBad")}</p> : null}
          <input
            ref={fileRef}
            className="file-hidden"
            type="file"
            accept="application/json,.json"
            aria-label={text(lang, "backupLoad")}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void file.text().then((raw) => {
                const notebooks = parseBackup(raw);
                if (!notebooks) {
                  setBackupNote("bad");
                  return;
                }
                replaceNotebooks(notebooks);
                setBackupNote("ok");
              });
            }}
          />
          <DeleteChoice
            label={text(lang, "delAll")}
            ask={text(lang, "delAllAsk")}
            yes={text(lang, "delAllYes")}
            no={text(lang, "delNo")}
            onYes={() => {
              clearAll();
              onClose();
            }}
          />
        </section>

        <section className="set-card">
          <p className="section-label">{text(lang, "newBook")}</p>
          <p className="set-lead">{text(lang, "nextBook")}</p>
          <p className="section-label">{text(lang, "cover")} · {coverName(defaults.cover, lang)}</p>
          <CoverPicker value={defaults.cover} onChange={(cover) => setDefaults({ cover })} />
          <p className="section-label">{text(lang, "form")} · {formatName(defaults.format, lang)}</p>
          <FormatPicker
            value={defaults.format}
            paper={defaults.paper}
            onChange={(format: FormatId) => setDefaults({ format })}
          />
          <p className="section-label">{text(lang, "paper")} · {paperName(defaults.paper, lang)}</p>
          <PaperPicker value={defaults.paper} onChange={(paper: PaperId) => setDefaults({ paper })} />
        </section>

        <section className="set-card about">
          <p className="kicker">Nibras Note</p>
          <p>{text(lang, "about")}</p>
        </section>
      </div>
      {langOpen ? (
        <Overlay label={text(lang, "langTitle")} onClose={() => setLangOpen(false)}>
          <p className="section-label">{text(lang, "langTitle")}</p>
          <p className="set-lead">{text(lang, "langLead")}</p>
          <LangPicker onDone={() => setLangOpen(false)} />
        </Overlay>
      ) : null}
    </div>
  );
}

export function Privacy({ onClose }: { onClose: () => void }) {
  const lang = useBook((s) => s.lang);
  return (
    <div className="device">
      <header className="topbar">
        <button type="button" className="icon-btn" aria-label={text(lang, "backSet")} onClick={onClose}>
          <ChevronLeft size={22} />
        </button>
        <div className="title-btn">
          <strong>{text(lang, "privacy")}</strong>
          <span>27.10.2026</span>
        </div>
      </header>
      <article className="settings policy">
        <p className="set-lead">{text(lang, "pLead")}</p>
        <h2>{text(lang, "hStore")}</h2>
        <p>{text(lang, "pStore")}</p>
        <h2>{text(lang, "hSend")}</h2>
        <p>{text(lang, "pSend")}</p>
        <h2>{text(lang, "hPic")}</h2>
        <p>{text(lang, "pPic")}</p>
        <h2>{text(lang, "hDel")}</h2>
        <p>{text(lang, "pDel")}</p>
        <h2>{text(lang, "hKid")}</h2>
        <p>{text(lang, "pKid")}</p>
        <h2>{text(lang, "hContact")}</h2>
        <p>{text(lang, "pContact")}</p>
        <p className="policy-links">
          <a href="https://nibrascode.com" target="_blank" rel="noreferrer">
            nibrascode.com
          </a>
          <a href="mailto:nibrascode@gmail.com">nibrascode@gmail.com</a>
        </p>
      </article>
    </div>
  );
}
