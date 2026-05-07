import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Sparkles, Loader2 } from 'lucide-react'
import { CATEGORIES } from '../../data/models'

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

const isImageFile = (f) => f && /\.(png|jpe?g|webp|avif)$/i.test(f.name)
const isGlbFile = (f) => f && /\.glb$/i.test(f.name)

function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = reject
        r.readAsDataURL(file)
    })
}

export default function AddModelDialog({ open, onClose, onAdd, prefillFile }) {
    const [mode, setMode] = useState('file')   // 'file' | 'url' | 'image'
    const [url, setUrl] = useState('')
    const [file, setFile] = useState(null)
    const [imageFile, setImageFile] = useState(null)
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
    const imageInputRef = useRef(null)

    React.useEffect(() => {
        if (prefillFile && open) {
            if (isImageFile(prefillFile)) {
                setImageFile(prefillFile); setMode('image'); setType('painting'); setCategory('paintings')
            } else if (isGlbFile(prefillFile)) {
                setFile(prefillFile); setMode('file')
            }
        }
    }, [prefillFile, open])

    const reset = () => {
        setUrl(''); setFile(null); setImageFile(null)
        setTitle(''); setArtist(''); setYear(''); setDescription('')
        setScale(1); setType('statue'); setCategory('modern')
        setAutoFillUrl(''); setAutoFillMsg(''); setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const runAutoFill = async () => {
        const u = autoFillUrl.trim()
        if (!u) { setAutoFillMsg('Paste the Sketchfab page URL first.'); return }
        if (!/sketchfab\.com\/3d-models\//i.test(u)) {
            setAutoFillMsg('Only Sketchfab page URLs are supported.'); return
        }
        setAutoFilling(true); setAutoFillMsg('')
        try {
            const meta = await fetchSketchfabMeta(u)
            if (meta.title) setTitle(meta.title)
            if (meta.artist) setArtist(meta.artist)
            setType(guessTypeFromTitle(meta.title))
            setCategory(guessCategoryFromTitle(meta.title))
            const lic = meta.license ? ` · License: ${meta.license}` : ''
            setDescription(`${meta.title || 'Untitled'} by ${meta.artist || 'Unknown'}.${lic} Source: Sketchfab.`)
            setAutoFillMsg(`Filled from Sketchfab: "${meta.title}" by ${meta.artist}.`)
        } catch {
            setAutoFillMsg("Couldn't fetch from Sketchfab. Fill the fields below manually.")
        } finally {
            setAutoFilling(false)
        }
    }

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        const id = `custom-${Date.now()}`
        let payload = null

        if (mode === 'image') {
            if (!imageFile) { setError('Please choose an image (JPG, PNG or WebP).'); return }
            const dataUrl = await readImageAsDataUrl(imageFile)
            payload = {
                model: {
                    id,
                    title: title.trim() || imageFile.name.replace(/\.\w+$/, ''),
                    artist: artist.trim() || 'Custom',
                    year: year.trim() || '—',
                    type: 'painting',
                    category: category === 'modern' ? 'paintings' : category,
                    description: description.trim() || 'A custom image added by you.',
                    file: id,
                    imageUrl: dataUrl,
                    sourceUrl: imageFile.name,
                    scale: Number(scale) || 1,
                },
                file: null,
            }
        } else if (mode === 'file') {
            if (!file) { setError('Please choose a .glb file.'); return }
            if (!isGlbFile(file)) { setError("That file isn't a .glb."); return }
            payload = {
                model: {
                    id,
                    title: title.trim() || file.name.replace(/\.glb$/i, ''),
                    artist: artist.trim() || 'Custom',
                    year: year.trim() || '—',
                    type, category,
                    description: description.trim() || 'A custom 3D model added by you.',
                    file: id,
                    remoteUrl: URL.createObjectURL(file),
                    sourceUrl: autoFillUrl.trim() || file.name,
                    scale: Number(scale) || 1,
                    pedestalHeight: type === 'statue' ? 1.0 : undefined,
                },
                file,
            }
        } else {
            const trimmed = url.trim()
            if (!trimmed) { setError('Please paste a direct .glb URL.'); return }
            if (/sketchfab\.com\/3d-models/i.test(trimmed)) {
                setError("Sketchfab page links can't load directly. Switch to \"Upload file\" — you can still autofill metadata above.")
                return
            }
            if (!/\.glb($|\?|#)/i.test(trimmed)) { setError('URL must point to a .glb file.'); return }
            payload = {
                model: {
                    id,
                    title: title.trim() || 'Custom Exhibit',
                    artist: artist.trim() || 'Custom',
                    year: year.trim() || '—',
                    type, category,
                    description: description.trim() || 'A custom 3D model added by you.',
                    file: id,
                    remoteUrl: trimmed,
                    sourceUrl: autoFillUrl.trim() || trimmed,
                    scale: Number(scale) || 1,
                    pedestalHeight: type === 'statue' ? 1.0 : undefined,
                },
                file: null,
            }
        }

        onAdd(payload)
        reset()
        onClose()
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="dialog-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}>
                    <motion.div className="dialog"
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h2>Add a 3D Model</h2>
                            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                        </div>

                        <div className="dialog-tabs">
                            <button type="button" className={mode === 'file' ? 'tab-active' : ''} onClick={() => { setMode('file'); setError('') }}>3D file</button>
                            <button type="button" className={mode === 'url' ? 'tab-active' : ''} onClick={() => { setMode('url'); setError('') }}>3D URL</button>
                            <button type="button" className={mode === 'image' ? 'tab-active' : ''} onClick={() => { setMode('image'); setError(''); setType('painting'); setCategory('paintings') }}>Image (painting)</button>
                        </div>

                        <p className="dialog-help">
                            {mode === 'file' && <>Pick a <strong>.glb</strong> from your computer (or drag-and-drop one onto the page).</>}
                            {mode === 'url' && <>Paste a direct <strong>.glb</strong> URL on a CORS-enabled CDN.</>}
                            {mode === 'image' && <>Pick a <strong>JPG / PNG / WebP</strong> — we'll mount it as a framed painting on the wall.</>}
                        </p>

                        <form onSubmit={submit} className="dialog-form">
                            {mode !== 'image' && (
                                <label>
                                    <span>Sketchfab URL <em style={{ opacity: 0.6 }}>(optional, autofills below)</em></span>
                                    <div className="file-row">
                                        <input type="url" value={autoFillUrl}
                                            onChange={(e) => { setAutoFillUrl(e.target.value); setAutoFillMsg('') }}
                                            placeholder="https://sketchfab.com/3d-models/…" />
                                        <button type="button" className="btn-ghost file-btn" onClick={runAutoFill}
                                            disabled={autoFilling} style={{ flex: 'none' }}>
                                            {autoFilling ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                                            <span>{autoFilling ? 'Fetching…' : 'Autofill'}</span>
                                        </button>
                                    </div>
                                    {autoFillMsg && <div className="dialog-help" style={{ margin: '0.4rem 0 0', opacity: 0.75 }}>{autoFillMsg}</div>}
                                </label>
                            )}

                            {mode === 'file' && (
                                <label>
                                    <span>Model file (.glb)</span>
                                    <div className="file-row">
                                        <input ref={fileInputRef} type="file" accept=".glb,model/gltf-binary"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                        <button type="button" className="btn-ghost file-btn" onClick={() => fileInputRef.current?.click()}>
                                            <Upload size={14} /><span>{file ? file.name : 'Choose .glb file…'}</span>
                                        </button>
                                    </div>
                                </label>
                            )}
                            {mode === 'url' && (
                                <label>
                                    <span>Model URL (.glb)</span>
                                    <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com/model.glb" />
                                </label>
                            )}
                            {mode === 'image' && (
                                <label>
                                    <span>Image file</span>
                                    <div className="file-row">
                                        <input ref={imageInputRef} type="file" accept="image/*"
                                            onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                                        <button type="button" className="btn-ghost file-btn" onClick={() => imageInputRef.current?.click()}>
                                            <Upload size={14} /><span>{imageFile ? imageFile.name : 'Choose image…'}</span>
                                        </button>
                                    </div>
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
                            {mode !== 'image' && (
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
                                            {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                        </select>
                                    </label>
                                </div>
                            )}
                            <label>
                                <span>Description</span>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A short description of the work…" rows={3} />
                            </label>
                            {mode !== 'image' && (
                                <label>
                                    <span>Scale</span>
                                    <input type="number" step="0.1" min="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
                                </label>
                            )}
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
