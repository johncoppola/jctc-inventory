// ===== PHOTOS — chunk #3 =====
// Mobile/desktop photo capture, gallery, and clone-from-SKU for items.
// Photos live in Supabase Storage bucket 'item-photos' at path '{sku}/{uuid}.jpg'.
// Metadata in public.item_photos (id, item_sku, storage_path, public_url, position, source).

const PHOTO_BUCKET = 'item-photos';

// In-memory cache: sku -> [{id, item_sku, storage_path, public_url, position, source, uploaded_at}]
const PHOTOS_BY_SKU = {};

// Currently-open photo sheet's SKU (so the sheet re-renders after add/delete/clone).
let _photoSheetSku = null;
// Lightbox state.
let _lightboxSku = null;
let _lightboxIdx = 0;

// Media-type helpers — we don't store a media_type column; derive from extension.
const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm|avi|mkv|qt|3gp)$/i;
function isVideoPath(path) { return VIDEO_EXT_RE.test(path || ''); }

// ===== LOAD =====
async function loadAllPhotos() {
  try {
    const rows = await supabase.select('item_photos', 'order=item_sku.asc,position.asc,uploaded_at.asc');
    // Reset cache and re-bucket.
    Object.keys(PHOTOS_BY_SKU).forEach(k => delete PHOTOS_BY_SKU[k]);
    rows.forEach(r => {
      const list = PHOTOS_BY_SKU[r.item_sku] || (PHOTOS_BY_SKU[r.item_sku] = []);
      list.push(r);
    });
  } catch (e) {
    console.error('loadAllPhotos failed:', e);
  }
}

function getPhotos(sku) { return PHOTOS_BY_SKU[sku] || []; }
function getPhotoCount(sku) { return getPhotos(sku).length; }

// ===== UUID (no library, RFC4122 v4 — good enough for storage keys) =====
function _uuid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ===== UPLOAD =====
async function uploadPhotosForSku(sku, files) {
  if (!files || !files.length) return;
  const existing = getPhotos(sku);
  let nextPos = existing.length ? Math.max(...existing.map(p => p.position || 0)) + 1 : 0;
  const inserted = [];
  for (const file of files) {
    const isImage = file.type && file.type.startsWith('image/');
    const isVideo = file.type && file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast(`Skipping ${file.name || 'file'} — not an image or video`);
      continue;
    }
    const id = _uuid();
    const defaultExt = isVideo ? 'mp4' : 'jpg';
    const ext = (file.name && file.name.split('.').pop() || defaultExt).toLowerCase().replace(/[^a-z0-9]/g, '') || defaultExt;
    const path = `${sku}/${id}.${ext}`;
    try {
      await supabase.storageUpload(PHOTO_BUCKET, path, file, file.type);
      const url = supabase.storagePublicUrl(PHOTO_BUCKET, path);
      const row = await supabase.insert('item_photos', {
        item_sku: sku,
        storage_path: path,
        public_url: url,
        position: nextPos++,
        source: 'capture'
      });
      const newRow = Array.isArray(row) ? row[0] : row;
      inserted.push(newRow);
    } catch (err) {
      console.error('uploadPhotosForSku item failed:', err);
      toast('Upload failed — check console');
    }
  }
  // Update cache and UI.
  if (!PHOTOS_BY_SKU[sku]) PHOTOS_BY_SKU[sku] = [];
  inserted.forEach(r => PHOTOS_BY_SKU[sku].push(r));
  _refreshPhotoCountCell(sku);
  if (_photoSheetSku === sku) _renderPhotoSheet();
  if (inserted.length) toast(`Added ${inserted.length} item${inserted.length === 1 ? '' : 's'}`);
}

// ===== DELETE =====
async function deletePhoto(photoId) {
  // Find which SKU this belongs to.
  let sku = null, photo = null;
  for (const [s, list] of Object.entries(PHOTOS_BY_SKU)) {
    const idx = list.findIndex(p => p.id === photoId);
    if (idx >= 0) { sku = Number(s); photo = list[idx]; break; }
  }
  if (!photo) return;
  if (!confirm('Delete this item?')) return;
  try {
    await supabase.storageDelete(PHOTO_BUCKET, [photo.storage_path]);
  } catch (e) {
    console.error('Storage delete failed (continuing to remove DB row):', e);
  }
  try {
    await supabase.delete('item_photos', `id=eq.${photoId}`);
  } catch (e) {
    console.error('item_photos delete failed:', e);
    toast('Delete failed — check console');
    return;
  }
  PHOTOS_BY_SKU[sku] = (PHOTOS_BY_SKU[sku] || []).filter(p => p.id !== photoId);
  _refreshPhotoCountCell(sku);
  if (_photoSheetSku === sku) _renderPhotoSheet();
  toast('Deleted');
}

// ===== CLONE FROM SKU =====
// Copies all photos from sourceSku onto destSku. Storage objects are server-side
// copied (no re-upload), then a new item_photos row is inserted for each.
async function clonePhotosFromSku(destSku, sourceSku) {
  if (sourceSku === destSku) { toast('Source and destination are the same SKU'); return; }
  const src = getPhotos(sourceSku);
  if (!src.length) { toast(`SKU ${sourceSku} has no photos`); return; }
  const existing = getPhotos(destSku);
  let nextPos = existing.length ? Math.max(...existing.map(p => p.position || 0)) + 1 : 0;
  const inserted = [];
  for (const p of src) {
    const ext = p.storage_path.split('.').pop() || 'jpg';
    const newPath = `${destSku}/${_uuid()}.${ext}`;
    try {
      await supabase.storageCopy(PHOTO_BUCKET, p.storage_path, newPath);
      const url = supabase.storagePublicUrl(PHOTO_BUCKET, newPath);
      const row = await supabase.insert('item_photos', {
        item_sku: destSku,
        storage_path: newPath,
        public_url: url,
        position: nextPos++,
        source: 'clone'
      });
      const newRow = Array.isArray(row) ? row[0] : row;
      inserted.push(newRow);
    } catch (err) {
      console.error('clonePhotosFromSku item failed:', err);
    }
  }
  if (!PHOTOS_BY_SKU[destSku]) PHOTOS_BY_SKU[destSku] = [];
  inserted.forEach(r => PHOTOS_BY_SKU[destSku].push(r));
  _refreshPhotoCountCell(destSku);
  if (_photoSheetSku === destSku) _renderPhotoSheet();
  toast(`Cloned ${inserted.length} item${inserted.length === 1 ? '' : 's'} from SKU ${sourceSku}`);
}

// ===== UI: PHOTO COUNT CELL (in row) =====
function photoCellHtml(item) {
  const n = getPhotoCount(item.sku);
  const cls = n > 0 ? 'photo-cell has-photos' : 'photo-cell';
  return `<td class="${cls}" data-photo-cell-sku="${item.sku}"><button class="photo-btn" onclick="openPhotoSheet(${item.sku})" title="Photos for SKU ${item.sku}">📷 ${n}</button></td>`;
}

function _refreshPhotoCountCell(sku) {
  const cells = document.querySelectorAll(`td[data-photo-cell-sku="${sku}"]`);
  cells.forEach(c => {
    const btn = c.querySelector('.photo-btn');
    const n = getPhotoCount(sku);
    if (btn) btn.textContent = `📷 ${n}`;
    c.classList.toggle('has-photos', n > 0);
  });
}

// ===== UI: PHOTO SHEET =====
function openPhotoSheet(sku) {
  _photoSheetSku = sku;
  document.getElementById('photoSheet').classList.add('show');
  _renderPhotoSheet();
}

function closePhotoSheet() {
  document.getElementById('photoSheet').classList.remove('show');
  _photoSheetSku = null;
}

function _renderPhotoSheet() {
  if (_photoSheetSku == null) return;
  const sku = _photoSheetSku;
  const item = DATA.items.find(i => i.sku === sku);
  const photos = getPhotos(sku);
  const titleEl = document.getElementById('photoSheetTitle');
  if (titleEl) {
    const label = item ? `${item.brand || ''} ${item.model || ''}`.trim() || `SKU ${sku}` : `SKU ${sku}`;
    titleEl.textContent = `${label} — ${photos.length} item${photos.length === 1 ? '' : 's'}`;
  }
  const grid = document.getElementById('photoSheetGrid');
  if (!photos.length) {
    grid.innerHTML = '<div class="photo-empty">No media yet. Tap “Add Media” or “Camera” to capture or upload.</div>';
  } else {
    grid.innerHTML = photos.map((p, idx) => {
      const vid = isVideoPath(p.storage_path);
      const inner = vid
        ? `<video src="${p.public_url}" muted playsinline preload="metadata" onclick="openLightbox(${sku},${idx})"></video><div class="photo-thumb-play" onclick="openLightbox(${sku},${idx})">▶</div>`
        : `<img src="${p.public_url}" alt="" onclick="openLightbox(${sku},${idx})" loading="lazy">`;
      return `<div class="photo-thumb${vid ? ' is-video' : ''}">
                ${inner}
                <button class="photo-thumb-del" onclick="deletePhoto('${p.id}')" title="Delete">&times;</button>
              </div>`;
    }).join('');
  }
}

// Triggered by the hidden "+ Add Media" file input (library picker, multi-select OK).
async function _onPhotoFileInput(input) {
  if (_photoSheetSku == null) return;
  const sku = _photoSheetSku;
  const files = Array.from(input.files || []);
  input.value = ''; // reset so picking the same file again still fires onchange
  if (!files.length) return;
  toast(`Uploading ${files.length} item${files.length === 1 ? '' : 's'}…`);
  await uploadPhotosForSku(sku, files);
}

// Triggered by the hidden "📷 Camera" file input. Re-opens the camera after each
// successful capture for rapid-burst mode. The user stops the loop by tapping
// Cancel in the iOS camera UI (which fires onchange with no files).
function _onCaptureInput(input) {
  if (_photoSheetSku == null) return;
  const sku = _photoSheetSku;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  // Re-trigger camera SYNCHRONOUSLY inside the user-gesture context, before the
  // upload's awaits push us into a microtask where input.click() would be ignored.
  try { input.click(); } catch (e) { console.warn('rapid capture re-open failed:', e); }
  uploadPhotosForSku(sku, files);
}

async function _onCloneFromSku() {
  if (_photoSheetSku == null) return;
  const dest = _photoSheetSku;
  const input = document.getElementById('photoCloneSrcSku');
  const src = parseInt(input.value, 10);
  if (!src || isNaN(src)) { toast('Enter a numeric source SKU'); input.focus(); return; }
  if (!DATA.items.find(i => i.sku === src)) { toast(`SKU ${src} not found`); return; }
  // If source photos aren't cached (unlikely), reload them.
  if (!PHOTOS_BY_SKU[src]) {
    try {
      const rows = await supabase.select('item_photos', `item_sku=eq.${src}&order=position.asc`);
      PHOTOS_BY_SKU[src] = rows;
    } catch (e) { console.error(e); }
  }
  await clonePhotosFromSku(dest, src);
  input.value = '';
}

// ===== UI: LIGHTBOX =====
function openLightbox(sku, idx) {
  _lightboxSku = sku;
  _lightboxIdx = idx;
  document.getElementById('photoLightbox').classList.add('show');
  _renderLightbox();
}

function closeLightbox() {
  document.getElementById('photoLightbox').classList.remove('show');
  const vid = document.getElementById('photoLightboxVid');
  if (vid) { vid.pause(); vid.removeAttribute('src'); vid.load(); }
  _lightboxSku = null;
}

function _renderLightbox() {
  if (_lightboxSku == null) return;
  const photos = getPhotos(_lightboxSku);
  if (!photos.length) { closeLightbox(); return; }
  if (_lightboxIdx < 0) _lightboxIdx = photos.length - 1;
  if (_lightboxIdx >= photos.length) _lightboxIdx = 0;
  const p = photos[_lightboxIdx];
  const img = document.getElementById('photoLightboxImg');
  const vid = document.getElementById('photoLightboxVid');
  if (isVideoPath(p.storage_path)) {
    img.style.display = 'none';
    img.removeAttribute('src');
    vid.style.display = '';
    vid.src = p.public_url;
  } else {
    vid.pause();
    vid.removeAttribute('src');
    vid.load();
    vid.style.display = 'none';
    img.style.display = '';
    img.src = p.public_url;
  }
  document.getElementById('photoLightboxCounter').textContent = `${_lightboxIdx + 1} / ${photos.length}`;
}

function lightboxNext() { if (_lightboxSku != null) { _lightboxIdx++; _renderLightbox(); } }
function lightboxPrev() { if (_lightboxSku != null) { _lightboxIdx--; _renderLightbox(); } }

// Keyboard nav for lightbox
document.addEventListener('keydown', (e) => {
  if (_lightboxSku == null) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') lightboxNext();
  else if (e.key === 'ArrowLeft') lightboxPrev();
});

// Touch swipe for lightbox (mobile). Ignore swipes on the <video> element so the
// native scrubber/controls keep working without flipping slides.
(function () {
  let startX = null;
  const lb = () => document.getElementById('photoLightbox');
  document.addEventListener('touchstart', (e) => {
    if (!lb() || !lb().classList.contains('show')) return;
    if (e.target && e.target.closest && e.target.closest('video')) { startX = null; return; }
    if (e.touches.length === 1) startX = e.touches[0].clientX;
  });
  document.addEventListener('touchend', (e) => {
    if (startX == null) return;
    const endX = (e.changedTouches[0] || {}).clientX;
    const dx = endX - startX;
    startX = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) lightboxNext(); else lightboxPrev();
  });
})();
