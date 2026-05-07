import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Sparkles, Loader2 } from 'lucide-react'
import { CATEGORIES } from '../../data/models'

/**
 * Try to fetch metadata from Sketchfab's public oEmbed endpoint.
 * No API key required, CORS-enabled.
 */
async function fetchSketchfabMeta(pageUrl) {
    const endpoint = `https://sketchfab.com/oembed?url=${encodeURIComponent(pageUrl)}&format=json`
    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('Sketchfab returned ' + res.status)
    const data = await res.json()
    return {
        title: data.title || '',
        artist: data.author_name || '',
        sourceUrl: pageUrl,
        license: data.license || '',
    }
}

function guessTypeFromTitle(t = '') {
    const s = t.toLowerCase()
    if (/(painting|portrait|canvas|fresco|landscape)/.test(s)) return 'painting'
    return 'statue'
}
function guessCategoryFromTitle(t = '') {
    const s = t.toLowerCase()
    if (/(painting|portrait|canvas|fresco)/.test(s)) return 'paintings'
    if (/(roman|greek|hellenistic|baroque|marble bust|18\d\d|17\d\d|16\d\d|bc|b\.c\.)/.test(s)) return 'classical'
    return 'modern'
}

export default function AddModelDialog({ open, onClose, onAdd, prefillFile }) {
    const [mode, setMode] = useState('file')
    const [url, setUrl] = useState('')
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [year, setYear] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('statue')
    const [category, setCategory] = useState('modern')
    const [scale, setScale] = useState(1)
    const [error, setError] = useState('')
    const [autoFillUrl, setAutoFillUrl] = useState('')
    const [autoFilling, setAutoFilling] = useState(false)
    const [autoFillMsg, setAutoFillMsg] = useState('')
    const fileInputRef = useRef(null)

    React.useEffect(() => {
        if (prefillFile && open) {
            setFile(prefillFile)
            setMode('file')
        }
    }, [prefillFile, open])

    const reset = () => {
        setUrl(''); setFile(null); setTitle(''); setArtist(''); setYear('')
        setDescription(''); setScale(1); setType('statue'); setCategory('modern')
        setAutoFillUrl(''); setAutoFillMsg(''); setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const runAutoFill = async () => {
        const u = autoFillUrl.trim()
        if (!u) {
            setAutoFillMsg('Paste the Sketchfab page URL first.')
            return
        }
        if (!/sketchfab\.com\/3d-models\//i.test(u)) {
            setAutoFillMsg('Only Sketchfab page URLs are supported (e.g. sketchfab.com/3d-models/...).')
            return
        }
        setAutoFilling(true); setAutoFillMsg('')
        try {
            const meta = await fetchSketchfabMeta(u)
            if (meta.title) setTitle(meta.title)
            if (meta.artist) setArtist(meta.artist)
            const t = guessTypeFromTitle(meta.title)
            const c = guessCategoryFromTitle(meta.title)
            setType(t); setCategory(c)
            const lic = meta.license ? ` · License: ${meta.license}` : ''
            setDescription(`${meta.title || 'Untitled'} by ${meta.artist || 'Unknown'}.${lic} Source: Sketchfab.`)
            setAutoFillMsg(`Filled from Sketchfab: "${meta.title}" by ${meta.artist}.`)
        } catch (err) {
            setAutoFillMsg("Couldn't fetch from Sketchfab. Fill the fields below manually.")
        } finally {
            setAutoFilling(false)
        }
    }

    const submit = (e) => {
        e.preventDefault()
        setError('')
        let finalUrl = ''
        let displaySource = ''
        let pickedFile = null

        if (mode === 'file') {
            if (!file) { setError('Please choose a .glb file from your computer.'); return }
            if (!/\.glb$/i.test(file.name)) {
                setError('That file isn\'t a .glb. On Sketchfab, pick the GLB download (not DAE/USDZ/glTF).')
                return
            }
            finalUrl = URL.createObjectURL(file)
            displaySource = autoFillUrl.trim() || file.name
            pickedFile = file
        } else {
            const trimmed = url.trim()
            if (!trimmed) { setError('Please paste a direct .glb URL.'); return }
            if (/sketchfab\.com\/3d-models/i.test(trimmed)) {
                setError("Sketchfab page links can't load directly. Switch to \"Upload file\" and pick the .glb you downloaded — you can still autofill the metadata above.")
                return
            }
            if (!/\.glb($|\?|#)/i.test(trimmed)) {
                setError('URL must point to a .glb file (e.g. ends in .glb).')
                return
            }
            finalUrl = trimmed
            displaySource = autoFillUrl.trim() || trimmed
        }

        const id = `custom-${Date.now()}`
        onAdd({
            model: {
                id,
                title: title.trim() || (file ? file.name.replace(/\.glb$/i, '') : 'Custom Exhibit'),
                artist: artist.trim() || 'Custom',
                year: year.trim() || '—',
                type,
                category,
                description: description.trim() || 'A custom 3D model added by you.',
                file: id,
                remoteUrl: finalUrl,
                sourceUrl: displaySource,
                scale: Number(scale) || 1,
                pedestalHeight: type === 'statue' ? 1.0 : undefined,
            },
            file: pickedFile,
        })
        reset()
        onClose()
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="dialog"
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-header">
                            <h2>Add a 3D Model</h2>
                            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                        </div>

                        <div className="dialog-tabs">
                            <button type="button" className={mode === 'file' ? 'tab-active' : ''} onClick={() => { setMode('file'); setError('') }}>Upload file</button>
                            <button type="button" className={mode === 'url' ? 'tab-active' : ''} onClick={() => { setMode('url'); setError('') }}>Paste URL</button>
                        </div>

                        <p className="dialog-help">
                            {mode === 'file' ? (
                                <>Pick a <strong>.glb</strong> from your computer (or drag-and-drop one onto the page).
                                On Sketchfab choose the <strong>GLB</strong> download.</>
                            ) : (
                                <>Paste a direct <strong>.glb</strong> URL on a CORS-enabled CDN.</>
                            )}
                        </p>

                        <form onSubmit={submit} className="dialog-form">
                            {/* Sketchfab autofill — works for any tab */}
                            <label>
                                <span>Sketchfab URL <em style={{ opacity: 0.6 }}>(optional, autofills the fields below)</em></span>
                                <div className="file-row">
                                    <input
                                        type="url"
                                        value={autoFillUrl}
                                        onChange={(e) => { setAutoFillUrl(e.target.value); setAutoFillMsg('') }}
                                        placeholder="https://sketchfab.com/3d-models/…"
                                    />
                                    <button
                                        type="button"
                                        className="btn-ghost file-btn"
                                        onClick={runAutoFill}
                                        disabled={autoFilling}
                                        style={{ flex: 'none' }}
                                    >
                                        {autoFilling ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                                        <span>{autoFilling ? 'Fetching…' : 'Autofill'}</span>
                                    </button>
                                </div>
                                {autoFillMsg && <div className="dialog-help" style={{ margin: '0.4rem 0 0', opacity: 0.75 }}>{autoFillMsg}</div>}
                            </label>

                            {mode === 'file' ? (
                                <label>
                                    <span>Model file (.glb)</span>
                                    <div className="file-row">
                                        <input ref={fileInputRef} type="file" accept=".glb,model/gltf-binary"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                        <button type="button" className="btn-ghost file-btn" onClick={() => fileInputRef.current?.click()}>
                                            <Upload size={14} />
                                            <span>{file ? file.name : 'Choose .glb file…'}</span>
                                        </button>
                                    </div>
                                </label>
                            ) : (
                                <label>
                                    <span>Model URL (.glb)</span>
                                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/model.glb" />
                                </label>
                            )}
                            <label>
                                <span>Title</span>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My exhibit" />
                            </label>
                            <div className="dialog-row">
                                <label>
                                    <span>Artist</span>
                                    <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Unknown" />
                                </label>
                                <label>
                                    <span>Year</span>
                                    <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="—" />
                                </label>
                            </div>
                            <div className="dialog-row">
                                <label>
                                    <span>Type</span>
                                    <select value={type} onChange={(e) => setType(e.target.value)}>
                                        <option value="statue">Statue / 3D object</option>
                                        <option value="painting">Painting (wall mount)</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Section</span>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                        {CATEGORIES.map((c) => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <label>
                                <span>Description <em style={{ opacity: 0.6 }}>(shown in the info panel)</em></span>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A short description of the work…"
                                    rows={3}
                                />
                            </label>
                            <label>
                                <span>Scale</span>
                                <input type="number" step="0.1" min="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
                            </label>
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
