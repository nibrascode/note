import { Editor } from "@/components/vereq/editor";
import { Shelf } from "@/components/vereq/shelf";
import { useBook } from "@/lib/store";

export function VereqApp() {
  const openId = useBook((s) => s.openId);
  const notebooks = useBook((s) => s.notebooks);
  const lang = useBook((s) => s.lang);
  const book = notebooks.find((item) => item.id === openId) ?? null;

  return (
    <div className="desk" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      {book ? <Editor book={book} /> : <Shelf />}
    </div>
  );
}
