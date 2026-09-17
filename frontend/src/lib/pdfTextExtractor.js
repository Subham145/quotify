import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set bundled local worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Normalizes all unicode dashes, hyphens, and whitespace
 */
function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

export async function extractTextFromPdf(file) {
  if (!file) throw new Error('No file provided');

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  const pageTexts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items || [];

    if (items.length === 0) continue;

    // 1. Raw Stream Text (preserving reading order)
    const rawStreamText = items.map((it) => cleanText(it.str)).join(' ');

    // 2. Spatial Y-Coordinate Grouped Text (with generous 8-point baseline tolerance)
    const yTolerance = 8;
    const sortedItems = [...items].sort((a, b) => {
      const yA = a.transform ? a.transform[5] : 0;
      const yB = b.transform ? b.transform[5] : 0;
      if (Math.abs(yA - yB) > yTolerance) {
        return yB - yA; // top to bottom
      }
      const xA = a.transform ? a.transform[4] : 0;
      const xB = b.transform ? b.transform[4] : 0;
      return xA - xB; // left to right
    });

    const rows = [];
    let currentRow = [];
    let currentY = null;

    for (const it of sortedItems) {
      const y = it.transform ? it.transform[5] : 0;
      const str = cleanText(it.str || '').trim();
      if (!str) continue;

      if (currentY === null || Math.abs(y - currentY) <= yTolerance) {
        currentRow.push(str);
        if (currentY === null) currentY = y;
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow.join(' '));
        }
        currentRow = [str];
        currentY = y;
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow.join(' '));
    }

    const rowText = rows.join('\n');

    // Combine both row-ordered and stream-ordered text
    pageTexts.push(`${rowText}\n\n--- RAW STREAM ---\n${rawStreamText}`);
  }

  return pageTexts.join('\n\n=== PAGE ===\n\n');
}
