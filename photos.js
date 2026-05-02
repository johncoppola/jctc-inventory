// ===== PHOTOS — chunks #3 + #8 =====
// Mobile/desktop photo capture, gallery, clone-from-SKU, and hero-flag for items.
// Photos live in Supabase Storage bucket 'item-photos' at path '{sku}/{uuid}.jpg'.
// Metadata in public.item_photos (id, item_sku, storage_path, public_url, position, source, is_hero).
// One-hero-per-SKU is enforced by a Postgres trigger; setting a new hero auto-unsets the old one server-side.

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
function getHeroPhoto(sku) { return getPhotos(sku).find(p => p.is_hero) || null; }

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

// ===== HERO FLAG (chunk #8) =====
// Toggle the hero flag for a photo. Setting one row to is_hero=true triggers a
// server-side BEFORE trigger that unsets is_hero on every other row for the same SKU,
// so we mirror that behaviour in the local cache after the round-trip succeeds.
async function toggleHeroPhoto(photoId) {
  let sku = null, photo = null;
  for (const [s, list] of Object.entries(PHOTOS_BY_SKU)) {
    const idx = list.findIndex(p => p.id === photoId);
    if (idx >= 0) { sku = Number(s); photo = list[idx]; break; }
  }
  if (!photo) return;
  if (isVideoPath(photo.storage_path)) { toast('Videos cannot be the hero photo'); return; }
  const newVal = !photo.is_hero;
  try {
    await supabase.update('item_photos', `id=eq.${photoId}`, { is_hero: newVal });
  } catch (e) {
    console.error('toggleHeroPhoto failed:', e);
    toast('Hero update failed — check console');
    return;
  }
  // Mirror the server trigger locally: when setting a new hero, clear all other heroes for this SKU.
  if (newVal) PHOTOS_BY_SKU[sku].forEach(p => { p.is_hero = (p.id === photoId); });
  else photo.is_hero = false;
  if (_photoSheetSku === sku) _renderPhotoSheet();
  toast(newVal ? 'Set as hero' : 'Hero unset');
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
      // Hero toggle is image-only — videos go in the listing's video field, not a photo slot.
      const heroBtn = vid
        ? ''
        : (p.is_hero
            ? `<button class="photo-thumb-hero is-hero" onclick="toggleHeroPhoto('${p.id}')" title="Hero (slot 1 in listings) — tap to unset">★ HERO</button>`
            : `<button class="photo-thumb-hero" onclick="toggleHeroPhoto('${p.id}')" title="Set as hero (slot 1 in listings)">☆</button>`);
      return `<div class="photo-thumb${vid ? ' is-video' : ''}${p.is_hero ? ' is-hero' : ''}">
                ${inner}
                ${heroBtn}
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

// ===== IN-APP CAMERA (burst mode) =====
// Uses getUserMedia for a live preview + canvas capture, so each shutter tap
// stores a photo immediately without the iOS "Use Photo / Retake" prompt.
// Video recording uses MediaRecorder on the same stream (re-acquired with audio)
// to bypass iOS Safari's aggressive transcoding of <input type=file> video capture.
let _incamStream = null;
let _incamFacing = 'environment';
let _incamCount = 0;
let _incamSku = null;
let _incamBusy = false;

// Recording state
let _incamRecorder = null;
let _incamRecChunks = [];
let _incamRecording = false;
let _incamRecStartedAt = 0;
let _incamRecTimer = null;
let _incamRecAutoStop = null;
let _incamRecMime = '';
let _incamRecAudioStream = null; // separate audio-only stream so we don't disturb the video preview
const INCAM_REC_MAX_MS = 60000;
const INCAM_REC_BITRATE = 8000000;

async function openInAppCamera() {
  if (_photoSheetSku == null) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Camera not supported on this browser');
    return;
  }
  _incamSku = _photoSheetSku;
  _incamCount = 0;
  document.getElementById('incamCounter').textContent = '0 captured';
  document.getElementById('incamOverlay').classList.add('show');
  await _startIncamStream();
}

async function _startIncamStream() {
  try {
    if (_incamStream) { _incamStream.getTracks().forEach(t => t.stop()); _incamStream = null; }
    _incamStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: _incamFacing },
        width:  { ideal: 4096 },
        height: { ideal: 2160 }
      },
      audio: false
    });
    const video = document.getElementById('incamVideo');
    video.srcObject = _incamStream;
    // iOS needs an explicit play() inside the user-gesture chain.
    try { await video.play(); } catch (_) {}
  } catch (e) {
    console.error('getUserMedia failed:', e);
    toast('Camera access denied or unavailable');
    closeInAppCamera();
  }
}

async function switchInAppCamera() {
  _incamFacing = (_incamFacing === 'environment') ? 'user' : 'environment';
  await _startIncamStream();
}

async function captureInAppPhoto() {
  if (!_incamStream || _incamSku == null || _incamBusy) return;
  const video = document.getElementById('incamVideo');
  if (!video.videoWidth || !video.videoHeight) { toast('Camera not ready'); return; }
  _incamBusy = true;
  // Optimistic UI: bump counter + flash before the encode finishes.
  _incamCount++;
  document.getElementById('incamCounter').textContent = `${_incamCount} captured`;
  const flash = document.getElementById('incamFlash');
  flash.classList.add('flashing');
  setTimeout(() => flash.classList.remove('flashing'), 140);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
    if (blob) {
      const file = new File([blob], `incam-${Date.now()}.jpg`, { type: 'image/jpeg' });
      uploadPhotosForSku(_incamSku, [file]); // background — don't block shutter
    }
  } catch (e) {
    console.error('captureInAppPhoto failed:', e);
    _incamCount = Math.max(0, _incamCount - 1);
    document.getElementById('incamCounter').textContent = `${_incamCount} captured`;
    toast('Capture failed');
  } finally {
    // Brief debounce so super-fast taps don't queue a flood of encodes.
    setTimeout(() => { _incamBusy = false; }, 120);
  }
}

function closeInAppCamera() {
  // If a recording is in flight, abort it so the partial blob doesn't upload.
  if (_incamRecording) {
    _incamRecording = false;
    if (_incamRecAutoStop) { clearTimeout(_incamRecAutoStop); _incamRecAutoStop = null; }
    if (_incamRecTimer) { clearInterval(_incamRecTimer); _incamRecTimer = null; }
    if (_incamRecorder) {
      try { _incamRecorder.ondataavailable = null; _incamRecorder.onstop = null; _incamRecorder.stop(); } catch (_) {}
    }
    _incamRecorder = null;
    _incamRecChunks = [];
    if (_incamRecAudioStream) { _incamRecAudioStream.getTracks().forEach(t => t.stop()); _incamRecAudioStream = null; }
    const recBtn = document.getElementById('incamRecBtn');
    const counter = document.getElementById('incamCounter');
    const shutter = document.getElementById('incamShutter');
    if (recBtn) recBtn.classList.remove('recording');
    if (counter) counter.classList.remove('recording');
    if (shutter) shutter.disabled = false;
  }
  if (_incamStream) { _incamStream.getTracks().forEach(t => t.stop()); _incamStream = null; }
  const video = document.getElementById('incamVideo');
  if (video) video.srcObject = null;
  document.getElementById('incamOverlay').classList.remove('show');
  _incamSku = null;
}

// ===== VIDEO RECORDING =====
// Pick the best mimetype the browser supports. mp4/h264 is preferred so iOS can
// play the file natively; webm/vp9 is the fallback for Chrome/Firefox/Android.
function _pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm'
  ];
  for (const t of candidates) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch (_) {}
  }
  return '';
}

async function toggleIncamRecording() {
  if (_incamRecording) await _stopIncamRecording();
  else await _startIncamRecording();
}

async function _startIncamRecording() {
  if (_incamSku == null) return;
  if (typeof MediaRecorder === 'undefined') { toast('Video recording not supported on this browser'); return; }
  if (!_incamStream) { toast('Camera not ready'); return; }
  // Don't touch the video preview — iOS Safari can leave a black frame when
  // srcObject is swapped mid-session. Instead, grab a separate audio-only
  // stream and compose it with the existing video track for the recorder.
  try {
    _incamRecAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.error('mic getUserMedia failed:', e);
    toast('Recording without audio (mic denied)');
    _incamRecAudioStream = null;
  }
  const videoTrack = _incamStream.getVideoTracks()[0];
  if (!videoTrack) { toast('Camera track unavailable'); return; }
  const recordStream = new MediaStream();
  recordStream.addTrack(videoTrack);
  if (_incamRecAudioStream) {
    const audioTrack = _incamRecAudioStream.getAudioTracks()[0];
    if (audioTrack) recordStream.addTrack(audioTrack);
  }
  _incamRecMime = _pickVideoMime() || '';
  try {
    const opts = { videoBitsPerSecond: INCAM_REC_BITRATE };
    if (_incamRecMime) opts.mimeType = _incamRecMime;
    _incamRecorder = new MediaRecorder(recordStream, opts);
  } catch (e) {
    console.error('MediaRecorder init failed:', e);
    toast('Recorder failed to start');
    if (_incamRecAudioStream) { _incamRecAudioStream.getTracks().forEach(t => t.stop()); _incamRecAudioStream = null; }
    return;
  }
  _incamRecChunks = [];
  _incamRecorder.ondataavailable = (e) => { if (e.data && e.data.size) _incamRecChunks.push(e.data); };
  _incamRecorder.onstop = _onIncamRecorderStop;
  // Timeslice so chunks accumulate during recording. Without this, iOS Safari
  // emits all data in a single dataavailable that fires after stop() — and if
  // the source tracks are stopped before that fires, the blob is lost.
  _incamRecorder.start(500);
  _incamRecording = true;
  _incamRecStartedAt = Date.now();
  // UI
  const recBtn = document.getElementById('incamRecBtn');
  const counter = document.getElementById('incamCounter');
  const shutter = document.getElementById('incamShutter');
  const switchBtn = document.getElementById('incamSwitchBtn');
  if (recBtn) recBtn.classList.add('recording');
  if (counter) counter.classList.add('recording');
  if (shutter) shutter.disabled = true;
  if (switchBtn) switchBtn.disabled = true;
  _updateIncamRecTimer();
  _incamRecTimer = setInterval(_updateIncamRecTimer, 250);
  // Hard cap so a forgotten recording doesn't chew through storage.
  _incamRecAutoStop = setTimeout(() => { if (_incamRecording) _stopIncamRecording(); }, INCAM_REC_MAX_MS);
}

function _updateIncamRecTimer() {
  const counter = document.getElementById('incamCounter');
  if (!counter || !_incamRecording) return;
  const s = Math.floor((Date.now() - _incamRecStartedAt) / 1000);
  const mm = String(Math.floor(s / 60));
  const ss = String(s % 60).padStart(2, '0');
  counter.textContent = `● REC ${mm}:${ss}`;
}

async function _stopIncamRecording() {
  if (!_incamRecording || !_incamRecorder) return;
  _incamRecording = false;
  if (_incamRecAutoStop) { clearTimeout(_incamRecAutoStop); _incamRecAutoStop = null; }
  if (_incamRecTimer) { clearInterval(_incamRecTimer); _incamRecTimer = null; }
  // UI reset (the upload kicks off from onstop).
  const recBtn = document.getElementById('incamRecBtn');
  const counter = document.getElementById('incamCounter');
  const shutter = document.getElementById('incamShutter');
  const switchBtn = document.getElementById('incamSwitchBtn');
  if (recBtn) recBtn.classList.remove('recording');
  if (counter) { counter.classList.remove('recording'); counter.textContent = `${_incamCount} captured`; }
  if (shutter) shutter.disabled = false;
  if (switchBtn) switchBtn.disabled = false;
  // Wait for the recorder's onstop to fire before tearing down the stream.
  // _onIncamRecorderStop runs synchronously inside this handler and kicks off
  // the upload, so by the time we resolve we know the blob is in flight.
  const recorder = _incamRecorder;
  await new Promise((resolve) => {
    if (!recorder) { resolve(); return; }
    const original = recorder.onstop;
    let done = false;
    const finish = (e) => {
      if (done) return;
      done = true;
      try { if (original) original(e); } finally { resolve(); }
    };
    recorder.onstop = finish;
    recorder.onerror = finish;
    try { recorder.stop(); } catch (_) { finish(); }
    // Belt-and-suspenders: if the browser never fires onstop, give up after 2s
    // and proceed to restart the stream so the user isn't stuck.
    setTimeout(finish, 2000);
  });
  // Stop only the dedicated audio track; the video preview was never touched.
  if (_incamRecAudioStream) {
    _incamRecAudioStream.getTracks().forEach(t => t.stop());
    _incamRecAudioStream = null;
  }
}

function _onIncamRecorderStop() {
  const chunks = _incamRecChunks;
  _incamRecChunks = [];
  const mime = _incamRecMime || 'video/mp4';
  _incamRecorder = null;
  if (!chunks.length || _incamSku == null) return;
  const ext = /mp4/i.test(mime) ? 'mp4' : 'webm';
  const blob = new Blob(chunks, { type: mime });
  const file = new File([blob], `incam-${Date.now()}.${ext}`, { type: mime });
  toast('Uploading video…');
  uploadPhotosForSku(_incamSku, [file]);
}

// Esc closes the in-app camera; Space/Enter triggers the shutter.
document.addEventListener('keydown', (e) => {
  const overlay = document.getElementById('incamOverlay');
  if (!overlay || !overlay.classList.contains('show')) return;
  if (e.key === 'Escape') { e.preventDefault(); closeInAppCamera(); }
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); captureInAppPhoto(); }
});

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
