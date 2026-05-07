import React, { useEffect, useRef, useState } from 'react'
import { Music, Music2 } from 'lucide-react'

export default function MusicBtn({ enabled, onToggle, volume, onVolumeChange }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    return (
        <div className="music-wrap" ref={wrapRef}>
            <button
                className={`icon-btn ${enabled ? 'active' : ''}`}
                onClick={onToggle}
                onContextMenu={(e) => { e.preventDefault(); setOpen((v) => !v) }}
                onDoubleClick={(e) => { e.preventDefault(); setOpen((v) => !v) }}
                aria-label={enabled ? 'Stop lobby music' : 'Play lobby music'}
                title={enabled ? 'Lobby music — click to stop, double-click for volume' : 'Lobby music — click to play, double-click for volume'}
            >
                {enabled ? <Music2 size={14} /> : <Music size={14} />}
            </button>
            {open && (
                <div className="music-popover">
                    <div className="music-pop-label">Music volume</div>
                    <input
                        type="range" min="0" max="100"
                        value={Math.round((volume ?? 0) * 100)}
                        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                    />
                </div>
            )}
        </div>
    )
}
