import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, Volume2, Square } from 'lucide-react'

function speak(text, onEnd) {
    if (!('speechSynthesis' in window)) return null
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.95
    utt.pitch = 1.0
    utt.volume = 1.0
    utt.onend = onEnd
    utt.onerror = onEnd
    window.speechSynthesis.speak(utt)
    return utt
}

export default function InfoPanel({ model, compact = false, onDelete }) {
    const [speaking, setSpeaking] = useState(false)
    const canDelete = !!model?._custom && typeof onDelete === 'function'

    // Stop narration when model changes
    useEffect(() => {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel()
        setSpeaking(false)
    }, [model?.id])

    if (!model) return null

    const onSpeak = () => {
        if (speaking) {
            window.speechSynthesis.cancel()
            setSpeaking(false)
            return
        }
        const text = [
            model.title,
            'by ' + model.artist + (model.year ? ', ' + model.year : ''),
            model.medium && model.dimensions ? `${model.medium}, ${model.dimensions}.` : (model.medium || model.dimensions || ''),
            model.description,
            model.location ? `On view: ${model.location}.` : '',
        ].filter(Boolean).join('. ')
        const u = speak(text, () => setSpeaking(false))
        if (u) setSpeaking(true)
    }

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

            {!compact && (
                <>
                    {(model.medium || model.dimensions) && (
                        <div className="meta-row">
                            {model.medium && <span>{model.medium}</span>}
                            {model.medium && model.dimensions && <span className="dot">·</span>}
                            {model.dimensions && <span>{model.dimensions}</span>}
                        </div>
                    )}
                    <p className="model-description">{model.description}</p>
                    {model.location && (
                        <div className="meta-location">On view at {model.location}</div>
                    )}
                </>
            )}

            <div className="info-actions">
                <button className="details-btn" onClick={onSpeak} title="Listen to a short audio guide">
                    {speaking ? <Square size={12} /> : <Volume2 size={12} />}
                    {speaking ? 'STOP NARRATION' : 'AUDIO GUIDE'}
                </button>
                {canDelete && (
                    <button
                        className="details-btn delete-btn"
                        onClick={() => {
                            if (window.confirm(`Remove "${model.title}" from your gallery?`)) {
                                onDelete(model.id)
                            }
                        }}
                    >
                        <Trash2 size={12} /> REMOVE
                    </button>
                )}
            </div>
        </motion.div>
    )
}
