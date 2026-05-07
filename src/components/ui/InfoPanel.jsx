import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export default function InfoPanel({ model, compact = false }) {
    if (!model) return null
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
            {model.sourceUrl && (
                <a
                    className="details-btn"
                    href={model.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <ExternalLink size={12} /> SKETCHFAB SOURCE
                </a>
            )}
        </motion.div>
    )
}
