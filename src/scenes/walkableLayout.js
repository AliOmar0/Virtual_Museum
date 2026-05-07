/**
 * Pure layout math for the walkable gallery, extracted so the minimap can
 * compute exhibit positions without importing the heavy 3D scene module.
 * Keep these constants in sync with WalkableScene.jsx.
 */
import { CATEGORIES } from '../data/models'

export const ROOM_WIDTH = 18
export const ROOM_HEIGHT = 8
export const SPACING = 9
export const PAINTING_Y = 3.2

function categoryFor(model) {
    return model.category || (model.type === 'painting' ? 'paintings' : 'classical')
}
function categoryMeta(id) {
    return CATEGORIES.find((c) => c.id === id) || { id, label: id, accent: '#d4af37' }
}

export function computeLayout(models) {
    const grouped = []
    const seen = new Map()
    models.forEach((m) => {
        const c = categoryFor(m)
        if (!seen.has(c)) {
            seen.set(c, [])
            grouped.push({ category: c, items: seen.get(c) })
        }
        seen.get(c).push(m)
    })

    const placements = []
    const dividers = []
    let z = -4

    grouped.forEach((g, gi) => {
        if (gi > 0) {
            dividers.push({ z: z + 1.4, label: categoryMeta(g.category).label, accent: categoryMeta(g.category).accent })
            z -= 2.5
        } else {
            dividers.push({ z: z + 2.0, label: categoryMeta(g.category).label, accent: categoryMeta(g.category).accent, first: true })
        }

        let paintingIdx = 0
        let statueIdx = 0
        g.items.forEach((m) => {
            if (m.type === 'painting') {
                const onLeft = paintingIdx % 2 === 0
                const slotZ = z - (Math.floor(paintingIdx / 2)) * SPACING
                const x = onLeft ? -ROOM_WIDTH / 2 + 0.18 : ROOM_WIDTH / 2 - 0.18
                const rotY = onLeft ? Math.PI / 2 : -Math.PI / 2
                placements.push({ model: m, position: [x, PAINTING_Y, slotZ], rotationY: rotY, category: g.category })
                paintingIdx++
            } else {
                const slotZ = z - (statueIdx * SPACING + 3)
                placements.push({ model: m, position: [0, 0, slotZ], rotationY: 0, category: g.category })
                statueIdx++
            }
        })
        const usedRows = Math.max(Math.ceil(paintingIdx / 2), statueIdx)
        z -= usedRows * SPACING + 4
    })

    return { placements, dividers, endZ: z }
}

export function computeWalkableLayout(models) {
    const { placements, endZ } = computeLayout(models)
    return {
        roomWidth: ROOM_WIDTH,
        roomDepth: Math.max(40, Math.abs(endZ) + 12),
        placements,
    }
}

export { categoryMeta }
