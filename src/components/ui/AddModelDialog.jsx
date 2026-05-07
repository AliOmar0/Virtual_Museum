import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload } from 'lucide-react'

export default function AddModelDialog({ open, onClose, onAdd }) {
    const [mode, setMode] = useState('file') // 'file' | 'url'
    const [url, setUrl] = useState('')
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [type, setType] = useState('statue')
    const [scale, setScale] = useState(1)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    // Track blob URLs we hand to the app so we can revoke them later
    const blobUrlsRef = useRef([])

    useEffect(() => {
        return () => {
            blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u))
        }
    }, [])

    const reset = () => {
        setUrl(''); setFile(null); setTitle(''); setScale(1); setType('statue'); setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const submit = (e) => {
        e.preventDefault()
        setError('')

        let finalUrl = ''
        let displaySource = ''

        if (mode === 'file') {
            if (!file) {
                setError('Please choose a .glb file from your computer.')
                return
            }
            if (!/\.glb$/i.test(file.name)) {
                setError('That file isn\'t a .glb. On Sketchfab, pick the GLB download (not DAE/USDZ/glTF).')
                return
            }
            finalUrl = URL.createObjectURL(file)
            blobUrlsRef.current.push(finalUrl)
            displaySource = file.name
        } else {
            const trimmed = url.trim()
            if (!trimmed) {
                setError('Please paste a direct .glb URL.')
                return
            }
            if (/sketchfab\.com\/3d-models/i.test(trimmed)) {
                setError("Sketchfab page links can't load directly. Switch to \"Upload file\" and pick the .glb you downloaded.")
                return
            }
            if (!/\.glb($|\?|#)/i.test(trimmed)) {
                setError('URL must point to a .glb file (e.g. ends in .glb).')
                return
            }
            finalUrl = trimmed
            displaySource = trimmed
        }

        const id = `custom-${Date.now()}`
        onAdd({
            id,
            title: title.trim() || (file ? file.name.replace(/\.glb$/i, '') : 'Custom Exhibit'),
            artist: 'Custom',
            year: '—',
            type,
            description: 'A custom 3D model added by you.',
            file: id,
            remoteUrl: finalUrl,
            sourceUrl: displaySource,
            scale: Number(scale) || 1,
            pedestalHeight: type === 'statue' ? 1.0 : undefined,
        })
        reset()
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

                        <div className="dialog-tabs">
                            <button
                                type="button"
                                className={mode === 'file' ? 'tab-active' : ''}
                                onClick={() => { setMode('file'); setError('') }}
                            >Upload file</button>
                            <button
                                type="button"
                                className={mode === 'url' ? 'tab-active' : ''}
                                onClick={() => { setMode('url'); setError('') }}
                            >Paste URL</button>
                        </div>

                        <p className="dialog-help">
                            {mode === 'file' ? (
                                <>Pick a <strong>.glb</strong> file from your computer. On Sketchfab, click
                                <em> Download 3D Model</em> and choose the <strong>GLB</strong> format
                                (not DAE/USDZ/glTF) — that's the file you upload here.</>
                            ) : (
                                <>Paste a direct <strong>.glb</strong> URL hosted on a CORS-enabled CDN
                                (e.g. GitHub raw, Cloudflare R2). Sketchfab page links don't work directly.</>
                            )}
                        </p>

                        <form onSubmit={submit} className="dialog-form">
                            {mode === 'file' ? (
                                <label>
                                    <span>Model file (.glb)</span>
                                    <div className="file-row">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".glb,model/gltf-binary"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-ghost file-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload size={14} />
                                            <span>{file ? file.name : 'Choose .glb file…'}</span>
                                        </button>
                                    </div>
                                </label>
                            ) : (
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
                            )}
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
