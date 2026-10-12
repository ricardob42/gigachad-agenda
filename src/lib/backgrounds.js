import { BG_CACHE } from './logic.js';

const path = (kind) => '/__gigachad-agenda-background__/' + (kind === 'mobile' ? 'mobile' : 'desktop');

export const bgAvailable = () => typeof caches !== 'undefined' && !!caches && typeof caches.open === 'function';

export async function bgLoad(kind) {
  if (!bgAvailable()) return null;
  try {
    const c = await caches.open(BG_CACHE), r = await c.match(path(kind));
    return r ? await r.blob() : null;
  } catch { return null; }
}
export async function bgSave(kind, file) {
  const c = await caches.open(BG_CACHE);
  await c.put(path(kind), new Response(file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } }));
}
export async function bgDelete(kind) {
  const c = await caches.open(BG_CACHE);
  await c.delete(path(kind));
}
/** Resolves if the file decodes as an image. */
export function bgDecodes(file) {
  return new Promise((ok, fail) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); ok(); };
    im.onerror = () => { URL.revokeObjectURL(u); fail(new Error('unreadable')); };
    im.src = u;
  });
}
