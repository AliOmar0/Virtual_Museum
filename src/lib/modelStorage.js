/**
 * Persistence layer for user-added models.
 *
 * - Metadata (title, type, scale, etc.) lives in localStorage.
 * - Binary .glb blobs (for "Upload file") live in IndexedDB so they survive
 *   page reloads. Each is keyed by the model id.
 * - URL-only models just store the URL string and reuse it on reload.
 *
 * On load, blob-backed models are rehydrated into fresh Blob URLs (object URLs
 * don't survive a page reload).
 */

const LS_KEY = 'museum.customModels.v1'
const DB_NAME = 'museum-models'
const STORE = 'blobs'

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1)
        req.onupgradeneeded = () => req.result.createObjectStore(STORE)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function idbGet(key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).get(key)
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function idbPut(key, value) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(value, key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

async function idbDelete(key) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

function readMeta() {
    try {
        const raw = localStorage.getItem(LS_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function writeMeta(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
}

/**
 * Load all persisted custom models. Returns an array of model objects ready to
 * drop into the gallery (with `remoteUrl` set to a usable URL or fresh blob URL).
 */
export async function loadCustomModels() {
    const meta = readMeta()
    const out = []
    for (const m of meta) {
        if (m._blobKey) {
            try {
                const blob = await idbGet(m._blobKey)
                if (!blob) continue
                const url = URL.createObjectURL(blob)
                out.push({ ...m, remoteUrl: url, _custom: true })
            } catch {
                // Skip if IDB read fails
            }
        } else if (m.remoteUrl) {
            out.push({ ...m, _custom: true })
        }
    }
    return out
}

/**
 * Persist a model added via the dialog.
 *  - If `file` is provided: store the file bytes in IDB; metadata records `_blobKey`.
 *  - Otherwise: just store the metadata (with the remote URL).
 *
 * Returns the meta object actually persisted (without the volatile blob URL).
 */
export async function saveCustomModel(model, file) {
    const meta = readMeta()
    const persisted = {
        id: model.id,
        title: model.title,
        artist: model.artist,
        year: model.year,
        type: model.type,
        description: model.description,
        file: model.file,
        sourceUrl: model.sourceUrl,
        scale: model.scale,
        pedestalHeight: model.pedestalHeight,
    }
    if (file) {
        persisted._blobKey = model.id
        await idbPut(model.id, file)
    } else {
        persisted.remoteUrl = model.remoteUrl
    }
    meta.push(persisted)
    writeMeta(meta)
    return persisted
}

/**
 * Delete a persisted custom model (and its blob, if any).
 */
export async function deleteCustomModel(id) {
    const meta = readMeta()
    const filtered = meta.filter((m) => m.id !== id)
    writeMeta(filtered)
    try { await idbDelete(id) } catch { /* ok if not present */ }
}
