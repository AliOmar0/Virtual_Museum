import React from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function AudioBtn({ enabled, onToggle }) {
    return (
        <button
            className={`icon-btn ${enabled ? 'active' : ''}`}
            onClick={onToggle}
            aria-label="Toggle ambient audio"
            title="Ambient audio"
        >
            {enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
    )
}
