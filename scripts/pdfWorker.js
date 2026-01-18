/* eslint-disable no-restricted-globals */
importScripts('https://unpkg.com/pdf-lib/dist/pdf-lib.min.js');

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function computePlacement(imgW, imgH, pageW, pageH, margin) {
  const availW = pageW - margin * 2;
  const availH = pageH - margin * 2;
  const scale = Math.min(availW / imgW, availH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const x = (pageW - drawW) / 2;
  const y = (pageH - drawH) / 2;
  return { x, y, drawW, drawH };
}

async function compressImage(buffer, type, maxDim = 2000, quality = 0.8) {
  const blob = new Blob([buffer], { type: type || 'image/*' });
  const bitmap = await createImageBitmap(blob);
  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));
  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();
  const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
  const ab = await jpegBlob.arrayBuffer();
  return { arrayBuffer: ab, width: targetW, height: targetH };
}

function wrapTextToLines(text, font, fontSize, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const tentative = line ? line + ' ' + w : w;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth) {
      line = tentative;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

self.onmessage = async (e) => {
  try {
    const { items, options } = e.data || {};
    const quality = options?.quality ?? 0.8;
    const maxDim = options?.maxDim ?? 2000;
    const margin = options?.margin ?? 24;

    const pdfDoc = await pdfLib.PDFDocument.create();
    const font = await pdfDoc.embedFont(pdfLib.StandardFonts.Helvetica);

    for (const it of items) {
      if (it.kind === 'image' && it.buffer) {
        const { arrayBuffer, width, height } = await compressImage(it.buffer, it.type, maxDim, quality);
        const jpg = await pdfDoc.embedJpg(arrayBuffer);
        const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const placement = computePlacement(width, height, A4_WIDTH, A4_HEIGHT, margin);
        page.drawImage(jpg, { x: placement.x, y: placement.y, width: placement.drawW, height: placement.drawH });
      } else if (it.kind === 'text' && it.text) {
        let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        const fontSize = 12;
        const lineHeight = Math.round(fontSize * 1.2);
        const maxWidth = A4_WIDTH - margin * 2;
        const lines = wrapTextToLines(it.text, font, fontSize, maxWidth);
        let x = margin;
        let y = A4_HEIGHT - margin - fontSize;
        for (const l of lines) {
          if (y <= margin) {
            page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            x = margin;
            y = A4_HEIGHT - margin - fontSize;
          }
          page.drawText(l, { x, y, size: fontSize, font });
          y -= lineHeight;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);
    self.postMessage({ ok: true, pdfBuffer }, [pdfBuffer]);
  } catch (err) {
    self.postMessage({ ok: false, error: String(err && err.message || err) });
  }
};
