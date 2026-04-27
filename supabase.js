// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://baedifidoanxdnkcwxte.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sYAMnlO_UfaJAqosUuQJHA_Nc-WYxxV';

// Lightweight Supabase REST client (no SDK dependency)
const supabase = {
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },

  rest(table) {
    return `${SUPABASE_URL}/rest/v1/${table}`;
  },

  // SELECT rows
  async select(table, query = '') {
    const res = await fetch(`${this.rest(table)}?${query}`, {
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Select ${table} failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // INSERT rows (single object or array)
  async insert(table, data) {
    const res = await fetch(this.rest(table), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Insert ${table} failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // UPDATE rows matching filter
  async update(table, filter, data) {
    const res = await fetch(`${this.rest(table)}?${filter}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Update ${table} failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // DELETE rows matching filter
  async delete(table, filter) {
    const res = await fetch(`${this.rest(table)}?${filter}`, {
      method: 'DELETE',
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Delete ${table} failed: ${res.status} ${await res.text()}`);
    return res;
  },

  // RPC call (for next_sku function)
  async rpc(fn, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(`RPC ${fn} failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // ===== STORAGE =====
  // Upload a Blob/File to a bucket at the given path. Overwrites if exists (upsert).
  async storageUpload(bucket, path, blob, contentType) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType || blob.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: blob
    });
    if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // Delete an object (or several) from a bucket.
  async storageDelete(bucket, paths) {
    const list = Array.isArray(paths) ? paths : [paths];
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefixes: list })
    });
    if (!res.ok) throw new Error(`Storage delete failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // Server-side copy from sourcePath to destPath inside the same bucket.
  async storageCopy(bucket, sourcePath, destPath) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/copy`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: bucket,
        sourceKey: sourcePath,
        destinationKey: destPath
      })
    });
    if (!res.ok) throw new Error(`Storage copy failed: ${res.status} ${await res.text()}`);
    return res.json();
  },

  // Build a public URL for an object in a public bucket.
  storagePublicUrl(bucket, path) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
};
