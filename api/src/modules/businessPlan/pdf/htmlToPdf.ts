/**
 * Convertit le HTML produit par l'éditeur de texte riche (Tiptap — balises
 * p/h1-3/ul/ol/li/strong/em/u/br, structure prévisible) en texte mis en forme
 * dans un PDFDocument pdfkit. Ce n'est PAS un parseur HTML général : pdfkit n'a
 * pas de moteur de rendu HTML/CSS, et l'entrée est toujours issue du même
 * éditeur — un tokenizer regex ciblé suffit et reste largement plus simple
 * qu'embarquer un moteur HTML complet pour ce seul besoin.
 */

type InlineSegment = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Découpe le contenu interne d'un bloc en segments {texte, gras, italique, souligné}. */
function tokenizeInline(html: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  let bold = false;
  let italic = false;
  let underline = false;

  const tagPattern = /<(\/?)(strong|b|em|i|u|br\s*\/?)>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushText = (raw: string) => {
    const text = decodeEntities(raw);
    if (text) segments.push({ text, bold, italic, underline });
  };

  while ((match = tagPattern.exec(html)) !== null) {
    pushText(html.slice(lastIndex, match.index));
    const [, closing, tagRaw] = match;
    const tag = tagRaw.toLowerCase().replace(/\s*\/$/, "");
    if (tag === "br") {
      segments.push({ text: "\n", bold, italic, underline });
    } else if (tag === "strong" || tag === "b") {
      bold = !closing;
    } else if (tag === "em" || tag === "i") {
      italic = !closing;
    } else if (tag === "u") {
      underline = !closing;
    }
    lastIndex = tagPattern.lastIndex;
  }
  pushText(html.slice(lastIndex));
  return segments;
}

function fontFor(bold: boolean, italic: boolean): string {
  if (bold && italic) return "Helvetica-BoldOblique";
  if (bold) return "Helvetica-Bold";
  if (italic) return "Helvetica-Oblique";
  return "Helvetica";
}

function renderSegments(
  pdf: PDFKit.PDFDocument,
  segments: InlineSegment[],
  options: { indent?: number; fontSize?: number } = {},
) {
  const fontSize = options.fontSize ?? 10;
  pdf.fontSize(fontSize);
  if (options.indent)
    pdf.text("", pdf.x + options.indent, pdf.y, { continued: false });

  const nonEmpty = segments.filter((s) => s.text.length > 0);
  if (nonEmpty.length === 0) {
    pdf.text(" ");
    return;
  }
  nonEmpty.forEach((seg, i) => {
    pdf.font(fontFor(seg.bold, seg.italic));
    pdf.text(seg.text, {
      continued: i < nonEmpty.length - 1,
      underline: seg.underline,
    });
  });
}

/** Rend un fragment HTML (sortie Tiptap) dans le document pdfkit, à la position courante. */
export function renderHtml(
  pdf: PDFKit.PDFDocument,
  html: string | null | undefined,
): void {
  if (!html || !html.trim()) {
    pdf
      .font("Helvetica-Oblique")
      .fontSize(9)
      .fillColor("#999")
      .text("Non renseigné.");
    pdf.fillColor("#000");
    return;
  }

  const blockPattern = /<(h[1-3]|p|ul|ol)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  let found = false;

  while ((match = blockPattern.exec(html)) !== null) {
    found = true;
    const [, tag, inner] = match;

    if (tag === "ul" || tag === "ol") {
      const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)];
      items.forEach((item, idx) => {
        const prefix = tag === "ul" ? "•  " : `${idx + 1}.  `;
        pdf
          .font("Helvetica")
          .fontSize(10)
          .text(prefix, { continued: true, indent: 12 });
        renderSegments(pdf, tokenizeInline(item[1]));
      });
    } else if (tag.startsWith("h")) {
      pdf.moveDown(0.3);
      renderSegments(
        pdf,
        tokenizeInline(inner).map((s) => ({ ...s, bold: true })),
        { fontSize: 12 },
      );
      pdf.moveDown(0.2);
    } else {
      renderSegments(pdf, tokenizeInline(inner));
      pdf.moveDown(0.3);
    }
  }

  if (!found) {
    // Contenu hérité en texte brut (avant l'introduction de l'éditeur riche) : affiché tel quel.
    pdf.font("Helvetica").fontSize(10).text(decodeEntities(html));
  }
}
