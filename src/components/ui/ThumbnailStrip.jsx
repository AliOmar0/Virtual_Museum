import React, { useState, useEffect } from 'react'
import { Image as ImageIcon, Box, Heart } from 'lucide-react'
import { readThumbnails } from '../../lib/modelStorage'

export default function ThumbnailStrip({ models, currentId, onSelect, thumbVersion = 0, favorites }) {
    const [thumbs, setThumbs] = useState({})
    useEffect(() => { setThumbs(readThumbnails()) }, [thumbVersion])

    if (models.length === 0) {
        return <div className="thumbnail-strip empty">No exhibits match your filter.</div>
    }

    return (
        <div className="thumbnail-strip">
            {models.map((m) => {
                const thumb = thumbs[m.id]
                const fav = favorites?.has(m.id)
                return (
                    <button
                        key={m.id}
                        className={`thumb ${m.id === currentId ? 'active' : ''}`}
                        onClick={() => onSelect(m.id)}
                        title={`${m.title} — ${m.artist}`}
                    >
                        {thumb ? (
                            <img src={thumb} alt="" className="thumb-img" />
                        ) : m.type === 'painting' ? <ImageIcon size={14} /> : <Box size={14} />}
                        <span className="thumb-label">{m.title}</span>
                        {fav && <Heart size={9} className="thumb-fav" fill="currentColor" />}
                    </button>
                )
            })}
        </div>
    )
}
