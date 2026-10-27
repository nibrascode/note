import { useEffect, useRef } from "react";
import { Paper } from "@/components/vereq/paper";
import { downloadNotebookPdf } from "@/lib/export-pdf";
import type { InkId, Notebook, PenWidth } from "@/lib/notebook";

export function PdfBook({
  book,
  ink,
  penWidth,
  onDone,
}: {
  book: Notebook;
  ink: InkId;
  penWidth: PenWidth;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 220));
      const root = ref.current;
      if (!root || cancel) return;
      const sheets = [...root.querySelectorAll(".sheet")].filter((node): node is HTMLElement => node instanceof HTMLElement);
      try {
        await downloadNotebookPdf(sheets, book.title);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancel) done.current();
      }
    };
    void run();
    return () => {
      cancel = true;
    };
  }, [book]);

  return (
    <div className="pdf-stage" ref={ref} aria-hidden="true">
      {book.pages.map((page) => (
        <Paper key={page.id} page={page} tool="text" ink={ink} penWidth={penWidth} reading onChange={() => {}} />
      ))}
    </div>
  );
}
