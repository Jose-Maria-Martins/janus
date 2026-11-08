/**
 * Builds a one-page placeholder PDF (a title and lines of text) and downloads it.
 * Written by hand so the demo needs no PDF library.
 */
export function downloadPdf(filename: string, title: string, lines: string[]) {
  // Helvetica with WinAnsi encoding: one byte per character.
  const WIN: Record<string, number> = { '€': 0x80, '–': 0x96, '—': 0x97, '’': 0x92, '“': 0x93, '”': 0x94 };
  const text = (s: string) =>
    '(' +
    [...s]
      .map((c) => {
        const code = WIN[c] ?? (c.charCodeAt(0) < 256 ? c.charCodeAt(0) : 63);
        const ch = String.fromCharCode(code);
        return ch === '(' || ch === ')' || ch === '\\' ? '\\' + ch : ch;
      })
      .join('') +
    ')';

  const stream = [
    'BT',
    '/F1 20 Tf 56 770 Td',
    `${text(title)} Tj`,
    '/F1 11 Tf 0 -40 Td',
    ...lines.flatMap((l) => [`${text(l)} Tj`, '0 -18 Td']),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = Uint8Array.from(pdf, (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
