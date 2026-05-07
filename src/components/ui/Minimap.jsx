import React from 'react'

/**
 * SVG minimap for the gallery. Shows a top-down view of the room with dots
 * for each exhibit and a triangle for the visitor's camera.
 */
export default function Minimap({
    roomWidth = 16,
    roomDepth = 40,
    placements = [],
    currentIndex = 0,
    cameraX = 0,
    cameraZ = 0,
    cameraYaw = 0,
}) {
    const PAD = 12
    const W = 180
    const aspect = roomWidth / roomDepth
    const H = Math.round(W / aspect)

    const xToSvg = (x) => PAD + ((x + roomWidth / 2) / roomWidth) * (W - PAD * 2)
    // z=0 is the front of the hall, z=-roomDepth is the back; map front (z=4) → top of svg
    const zToSvg = (z) => {
        // Domain: z in [-roomDepth + 4, 4]; map +4 → top, -roomDepth+4 → bottom
        const t = (4 - z) / roomDepth
        return PAD + t * (H - PAD * 2)
    }

    return (
        <div className="minimap">
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
                <rect x={PAD - 4} y={PAD - 4} width={W - (PAD - 4) * 2} height={H - (PAD - 4) * 2}
                    fill="rgba(20,18,16,0.9)" stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" rx="6" />

                {placements.map((p, i) => {
                    const cx = xToSvg(p.position[0])
                    const cy = zToSvg(p.position[2])
                    const isPainting = p.model.type === 'painting'
                    const fill = i === currentIndex ? '#d4af37' : (isPainting ? '#a17a32' : '#cfc8bd')
                    return (
                        <circle key={p.model.id} cx={cx} cy={cy} r={i === currentIndex ? 5 : 3.5} fill={fill}>
                            <title>{p.model.title} — {p.model.artist}</title>
                        </circle>
                    )
                })}

                {/* Camera triangle */}
                <g transform={`translate(${xToSvg(cameraX)}, ${zToSvg(cameraZ)}) rotate(${(cameraYaw * 180) / Math.PI})`}>
                    <polygon points="0,-7 5,5 -5,5" fill="#7a9bbf" stroke="#fff" strokeWidth="0.8" />
                </g>
            </svg>
            <div className="minimap-legend">YOU ARE HERE</div>
        </div>
    )
}
