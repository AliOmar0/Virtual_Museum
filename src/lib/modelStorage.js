/**
 * Persistence layer for user-added models + thumbnails.
 *
 * - Metadata (title, type, scale, etc.) lives in localStorage.
 * - Binary .glb blobs (for "Upload file") live in IndexedDB so they survive
 *   page reloads. Each is keyed by the model id.
 * - URL-only models just store the URL string and reuse it on reload.
 * - Per-model thumbnail data URLs live in localStorage under THUMB_KEY.
 */

const LS_KEY = 'museum.customModels.v1'
const THUMB_KEY = 'museum.thumbs.v1'
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
    } catch { return [] }
}

function writeMeta(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
}

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
            } catch { /* skip */ }
        } else if (m.remoteUrl) {
            out.push({ ...m, _custom: true })
        }
    }
    return out
}

export async function saveCustomModel(model, file) {
    const meta = readMeta()
    const persisted = {
        id: model.id,
        title: model.title,
        artist: model.artist,
        year: model.year,
        type: model.type,
        category: model.category,
        description: model.description,
        medium: model.medium,
        dimensions: model.dimensions,
        location: model.location,
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

export async function deleteCustomModel(id) {
    const meta = readMeta()
    writeMeta(meta.filter((m) => m.id !== id))
    try { await idbDelete(id) } catch { /* ok */ }
    deleteThumbnail(id)
}

export function readThumbnails() {
    try {
        const raw = localStorage.getItem(THUMB_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch { return {} }
}

export function saveThumbnail(id, dataUrl) {
    try {
        const map = readThumbnails()
        // Cap individual thumbnails to ~120 KB to avoid bloating localStorage
        if (typeof dataUrl !== 'string' || dataUrl.length > 200_000) return
        map[id] = dataUrl
        localStorage.setItem(THUMB_KEY, JSON.stringify(map))
    } catch { /* localStorage full — silently skip */ }
}

export function deleteThumbnail(id) {
    try {
        const map = readThumbnails()
        if (id in map) {
            delete map[id]
            localStorage.setItem(THUMB_KEY, JSON.stringify(map))
        }
    } catch { /* ignore */ }
}
