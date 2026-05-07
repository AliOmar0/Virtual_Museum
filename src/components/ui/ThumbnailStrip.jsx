import React from 'react'
import { Image as ImageIcon, Box } from 'lucide-react'

export default function ThumbnailStrip({ models, currentIndex, onSelect }) {
    return (
        <div className="thumbnail-strip">
            {models.map((m, i) => (
                <button
                    key={m.id}
                    className={`thumb ${i === currentIndex ? 'active' : ''}`}
                    onClick={() => onSelect(i)}
                    title={`${m.title} — ${m.artist}`}
                >
                    {m.type === 'painting' ? <ImageIcon size={14} /> : <Box size={14} />}
                    <span className="thumb-label">{m.title}</span>
                </button>
            ))}
        </div>
    )
}
