const KEY = 'museum.favorites.v1'

export function readFavorites() {
    try {
        const raw = localStorage.getItem(KEY)
        const arr = raw ? JSON.parse(raw) : []
        return new Set(Array.isArray(arr) ? arr : [])
    } catch { return new Set() }
}

export function writeFavorites(set) {
    try {
        localStorage.setItem(KEY, JSON.stringify([...set]))
    } catch {}
}

export function toggleFavorite(set, id) {
    const next = new Set(set)
    if (next.has(id)) next.delete(id); else next.add(id)
    writeFavorites(next)
    return next
}
