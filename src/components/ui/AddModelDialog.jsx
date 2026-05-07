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
        source: 'sketchfab',
        title: data.title || '',
        artist: data.author_name || '',
        sourceUrl: pageUrl,
        license: data.license || '',
        description: '',
    }
}

async function fetchWikipediaMeta(query) {
    const title = encodeURIComponent(query.trim())
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('Wikipedia returned ' + res.status)
    const data = await res.json()
    if (data.type === 'disambiguation') throw new Error('disambiguation')
    return {
        source: 'wikipedia',
        title: data.title || query,
        artist: '',
        year: '',
        description: data.extract || '',
        sourceUrl: data.content_urls?.desktop?.page || '',
        license: 'Wikipedia / CC BY-SA',
    }
}

// Pull a 4-digit year out of free text if present
function extractYear(text = '') {
    const m = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
    return m ? m[1] : ''
}
// Try to extract "by Artist Name" or "Artist Name (1890–1955)"
function extractArtist(text = '') {
    const m = text.match(/by\s+([A-Z][\w'.\-]+(?:\s+[A-Z][\w'.\-]+){0,3})/)
    if (m) return m[1]
    return ''
}
function guessTypeFromTitle(t = '') {
    const s = t.toLowerCase()
    if (/(painting|portrait|canvas|fresco|landscape|mural)/.test(s)) return 'painting'
    return 'statue'
}
function guessCategoryFromTitle(t = '') {
    const s = t.toLowerCase()
    if (/(painting|portrait|canvas|fresco|mural)/.test(s)) return 'paintings'
    if (/(roman|greek|hellenistic|baroque|renaissance|marble bust|marble statue|antiqu|18\d\d|17\d\d|16\d\d|bc|b\.c\.)/.test(s)) return 'classical'
    return 'modern'
}

function buildPlaceholderDescription(title, artist, year) {
    const t = title?.trim() || 'this work'
    const a = artist?.trim()
    const y = year?.trim()
    const lead = a ? `${t} is a notable work by ${a}` : `${t} is a notable work in this collection`
    const dated = y ? `${lead}, dated to ${y}.` : `${lead}.`
    return `${dated} Explore it from every angle — drag to rotate, scroll to zoom in on details, and use the audio guide for a short narration.`
}

const isImageFile = (f) => f && /\.(png|jpe?g|webp|avif)$/i.test(f.name)
const isGlbFile = (f) => f && /\.glb$/i.test(f.name)
const isUrl = (s) => /^https?:\/\//i.test(s.trim())
const isSketchfabUrl = (s) => /sketchfab\.com\/3d-models\//i.test(s)

function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = reject
        r.readAsDataURL(file)
    })
}

export default function AddModelDialog({ open, onClose, onAdd, prefillFile }) {
    const [mode, setMode] = useState('file')
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
    const [autoFillQuery, setAutoFillQuery] = useState('')
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
        setAutoFillQuery(''); setAutoFillMsg(''); setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const applyMeta = (meta) => {
        if (meta.title) setTitle(meta.title)
        const detectedYear = meta.year || extractYear(meta.description)
        if (detectedYear) setYear(detectedYear)
        const detectedArtist = meta.artist || extractArtist(meta.description)
        if (detectedArtist) setArtist(detectedArtist)
        setType(guessTypeFromTitle(meta.title))
        setCategory(guessCategoryFromTitle(meta.title))
        const desc = (meta.description || '').slice(0, 540).trim()
        if (desc) {
            const tail = meta.license ? ` (Source: ${meta.source === 'wikipedia' ? 'Wikipedia' : 'Sketchfab'} · ${meta.license})` : ''
            setDescription(desc + tail)
        } else {
            setDescription(buildPlaceholderDescription(meta.title, detectedArtist, detectedYear))
        }
    }

    const runAutoFill = async () => {
        const q = autoFillQuery.trim()
        if (!q) {
            const seedTitle = title.trim() || file?.name?.replace(/\.glb$/i, '') || imageFile?.name?.replace(/\.\w+$/, '') || ''
            if (!seedTitle) {
                setAutoFillMsg('Type a work title (e.g. "Mona Lisa") or paste a Sketchfab URL.')
                return
            }
            return runAutoFillWith(seedTitle)
        }
        return runAutoFillWith(q)
    }

    const runAutoFillWith = async (q) => {
        setAutoFilling(true); setAutoFillMsg('')
        try {
            if (isUrl(q) && isSketchfabUrl(q)) {
                const meta = await fetchSketchfabMeta(q)
                applyMeta(meta)
                setAutoFillMsg(`Filled from Sketchfab: "${meta.title}" by ${meta.artist || 'Unknown'}.`)
                // Best-effort enrichment from Wikipedia if we got a clean title
                if (meta.title) {
                    try {
                        const wiki = await fetchWikipediaMeta(meta.title)
                        if (wiki.description) {
                            setDescription((prev) => prev || wiki.description)
                            const y = extractYear(wiki.description)
                            if (y) setYear((prev) => prev || y)
                        }
                    } catch { /* ok, optional */ }
                }
            } else {
                const meta = await fetchWikipediaMeta(q)
                applyMeta(meta)
                setAutoFillMsg(`Filled from Wikipedia: "${meta.title}".`)
            }
        } catch (err) {
            const seedTitle = q && !isUrl(q) ? q : (title.trim() || 'Untitled')
            setTitle((prev) => prev || seedTitle)
            setDescription((prev) => prev || buildPlaceholderDescription(seedTitle, artist, year))
            setAutoFillMsg("Couldn't find a match — filled with placeholder text you can edit.")
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
                    description: description.trim() || buildPlaceholderDescription(title, artist, year),
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
                    description: description.trim() || buildPlaceholderDescription(title, artist, year),
                    file: id,
                    remoteUrl: URL.createObjectURL(file),
                    sourceUrl: autoFillQuery.trim() || file.name,
                    scale: Number(scale) || 1,
                    pedestalHeight: type === 'statue' ? 1.0 : undefined,
                },
                file,
            }
        } else {
            const trimmed = url.trim()
            if (!trimmed) { setError('Please paste a direct .glb URL.'); return }
            if (/sketchfab\.com\/3d-models/i.test(trimmed)) {
                setError("Sketchfab page links can't load directly. Switch to \"3D file\" — you can still autofill metadata above.")
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
                    description: description.trim() || buildPlaceholderDescription(title, artist, year),
                    file: id,
                    remoteUrl: trimmed,
                    sourceUrl: autoFillQuery.trim() || trimmed,
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
                            <div className="autofill-block">
                                <label className="autofill-label">
                                    <span>Smart autofill</span>
                                    <em className="autofill-hint">Sketchfab URL, work title, or artist — we'll search Wikipedia.</em>
                                </label>
                                <div className="autofill-row">
                                    <input
                                        type="text"
                                        value={autoFillQuery}
                                        onChange={(e) => { setAutoFillQuery(e.target.value); setAutoFillMsg('') }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runAutoFill() } }}
                                        placeholder='e.g. "The Thinker by Rodin" or a Sketchfab URL'
                                    />
                                    <button type="button" className="autofill-btn" onClick={runAutoFill} disabled={autoFilling} title="Autofill metadata">
                                        {autoFilling ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                                    </button>
                                </div>
                                {autoFillMsg && <div className="autofill-msg">{autoFillMsg}</div>}
                            </div>

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
                            {mode !== 'image' ? (
                                <div className="dialog-row dialog-row-3">
                                    <label>
                                        <span>Type</span>
                                        <select value={type} onChange={(e) => setType(e.target.value)}>
                                            <option value="statue">Statue</option>
                                            <option value="painting">Painting</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span>Section</span>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                            {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Scale</span>
                                        <input type="number" step="0.1" min="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
                                    </label>
                                </div>
                            ) : (
                                <div className="dialog-row">
                                    <label>
                                        <span>Section</span>
                                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                            {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Scale</span>
                                        <input type="number" step="0.1" min="0.01" value={scale} onChange={(e) => setScale(e.target.value)} />
                                    </label>
                                </div>
                            )}
                            <label>
                                <span>Description</span>
                                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A short description of the work…" rows={3} />
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
