import React from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

export default function InfoPanel({ model, compact = false, onDelete }) {
    if (!model) return null
    const canDelete = !!model._custom && typeof onDelete === 'function'
    return (
        <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`info-panel ${compact ? 'compact' : ''}`}
        >
            <div className="artist-badge">{model.artist}</div>
            <h1 className="model-title">{model.title}</h1>
            <div className="year-tag">{model.year}</div>
            {!compact && <p className="model-description">{model.description}</p>}
            {canDelete && (
                <button
                    className="details-btn delete-btn"
                    onClick={() => {
                        if (window.confirm(`Remove "${model.title}" from your gallery?`)) {
                            onDelete(model.id)
                        }
                    }}
                >
                    <Trash2 size={12} /> REMOVE EXHIBIT
                </button>
            )}
        </motion.div>
    )
}
