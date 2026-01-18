// Lightweight thumbnail generator using OffscreenCanvas when available.
// Returns a Blob URL for a small JPEG to keep DOM memory low.

/**
 * Generate a low-res thumbnail for preview.
 * - Uses createImageBitmap for fast decode
 * - Resizes to fit within maxSize (default 300px)
 * - Outputs JPEG Blob URL
 * @param {File|Blob} file
 * @param {{maxSize?: number, quality?: number}} [opts]
 * @returns {Promise<{ url: string, width: number, height: number, revoke: () => void }>} 
 */
export async function generateThumbnail(file, opts) {
  const maxSize = opts?.maxSize ?? 300;
  const quality = opts?.quality ?? 0.7;

  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  let blob;
  if (typeof OffscreenCanvas !== 'undefined') {
    const canv = new OffscreenCanvas(tw, th);
    const ctx = canv.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();
    blob = await canv.convertToBlob({ type: 'image/jpeg', quality });
  } else {
    const canv = document.createElement('canvas');
    canv.width = tw; canv.height = th;
    const ctx = canv.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();
    blob = await new Promise((resolve) => canv.toBlob((b)=>resolve(b), 'image/jpeg', quality));
  }
  const url = URL.createObjectURL(blob);
  return { url, width: tw, height: th, revoke: () => URL.revokeObjectURL(url) };
}
