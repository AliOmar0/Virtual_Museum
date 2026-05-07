import React, { useState, useEffect } from 'react'
import { Image as ImageIcon, Box } from 'lucide-react'
import { readThumbnails } from '../../lib/modelStorage'

export default function ThumbnailStrip({ models, currentIndex, onSelect, thumbVersion = 0 }) {
    const [thumbs, setThumbs] = useState({})
    useEffect(() => { setThumbs(readThumbnails()) }, [thumbVersion])

    return (
        <div className="thumbnail-strip">
            {models.map((m, i) => {
                const thumb = thumbs[m.id]
                return (
                    <button
                        key={m.id}
                        className={`thumb ${i === currentIndex ? 'active' : ''}`}
                        onClick={() => onSelect(i)}
                        title={`${m.title} — ${m.artist}`}
                    >
                        {thumb ? (
                            <img src={thumb} alt="" className="thumb-img" />
                        ) : m.type === 'painting' ? <ImageIcon size={14} /> : <Box size={14} />}
                        <span className="thumb-label">{m.title}</span>
                    </button>
                )
            })}
        </div>
    )
}
