import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function AddModelDialog({ open, onClose, onAdd }) {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [type, setType] = useState('statue')
    const [scale, setScale] = useState(1)
    const [error, setError] = useState('')

    const submit = (e) => {
        e.preventDefault()
        setError('')
        if (!url.trim()) {
            setError('Please paste a direct .glb URL.')
            return
        }
        const trimmed = url.trim()
        if (/sketchfab\.com\/3d-models/i.test(trimmed)) {
            setError("Sketchfab page links can't be loaded directly. Download the .glb file first, host it somewhere with CORS enabled, then paste that direct URL.")
            return
        }
        if (!/\.glb($|\?|#)/i.test(trimmed)) {
            setError('URL must point to a .glb file (e.g. ends in .glb).')
            return
        }
        const id = `custom-${Date.now()}`
        onAdd({
            id,
            title: title.trim() || 'Custom Exhibit',
            artist: 'Custom',
            year: '—',
            type,
            description: 'A custom 3D model added from a direct URL.',
            file: id,
            remoteUrl: url.trim(),
            sourceUrl: url.trim(),
            scale: Number(scale) || 1,
            wallSize: type === 'painting' ? [3, 3] : undefined,
            pedestalHeight: type === 'statue' ? 1.1 : undefined,
        })
        setUrl(''); setTitle(''); setScale(1); setType('statue')
        onClose()
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="dialog"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-header">
                            <h2>Add a 3D Model</h2>
                            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                        </div>
                        <p className="dialog-help">
                            Paste a direct <strong>.glb</strong> file URL. Sketchfab page links
                            (sketchfab.com/3d-models/...) won't work directly &mdash; download the model
                            from Sketchfab (when the author allows), then host the .glb on any CDN
                            (e.g. GitHub raw, Cloudflare R2) and paste that URL here. The host must
                            allow CORS.
                        </p>
                        <form onSubmit={submit} className="dialog-form">
                            <label>
                                <span>Model URL (.glb)</span>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com/model.glb"
                                    autoFocus
                                />
                            </label>
                            <label>
                                <span>Title</span>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="My exhibit"
                                />
                            </label>
                            <div className="dialog-row">
                                <label>
                                    <span>Type</span>
                                    <select value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value="statue">Statue / 3D object</option>
                                        <option value="painting">Painting (wall mount)</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Scale</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.01"
                                        value={scale}
                                        onChange={(e) => setScale(e.target.value)}
                                    />
                                </label>
                            </div>
                            {error && <div className="dialog-error">{error}</div>}
                            <div className="dialog-actions">
                                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary">Add to Gallery</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
