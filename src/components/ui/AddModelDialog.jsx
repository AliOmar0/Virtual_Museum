import React, { useState, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Sparkles, Loader2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { CATEGORIES } from '../../data/models'

const ModelPreview = lazy(() => import('./ModelPreview'))

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
        description: data.extract || '',
        sourceUrl: data.content_urls?.desktop?.page || '',
        license: 'Wikipedia / CC BY-SA',
    }
}

function extractYear(text = '') {
    const m = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
    return m ? m[1] : ''
}
function extractArtist(text = '') {
    const m = text.match(/by\s+([A-Z][\w'.\-]+(?:\s+[A-Z][\w'.\-]+){0,3})/)
    return m ? m[1] : ''
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
const deg = (rad) => (rad * 180 / Math.PI)
const rad = (deg) => (deg * Math.PI / 180)

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
    const [imageDataUrl, setImageDataUrl] = useState('')
    const [fileBlobUrl, setFileBlobUrl] = useState('')
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [year, setYear] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('statue')
    const [category, setCategory] = useState('modern')
    const [scale, setScale] = useState(1)
    const [tiltXDeg, setTiltXDeg] = useState(0)
    const [tiltYDeg, setTiltYDeg] = useState(0)
    const [tiltZDeg, setTiltZDeg] = useState(0)
    const [yOffset, setYOffset] = useState(0)
    const [previewOpen, setPreviewOpen] = useState(true)
    const [error, setError] = useState('')
    const [autoFillQuery, setAutoFillQuery] = useState('')
    const [autoFilling, setAutoFilling] = useState(false)
    const [autoFillMsg, setAutoFillMsg] = useState('')
    const fileInputRef = useRef(null)
    const imageInputRef = useRef(null)

    // Build a blob URL when a .glb file is picked, so the preview can load it.
    useEffect(() => {
        if (!file) { setFileBlobUrl(''); return }
        const u = URL.createObjectURL(file)
        setFileBlobUrl(u)
        return () => { try { URL.revokeObjectURL(u) } catch {} }
    }, [file])

    // Build a data URL when an image is picked, so the preview can load it.
    useEffect(() => {
        if (!imageFile) { setImageDataUrl(''); return }
        let cancelled = false
        readImageAsDataUrl(imageFile).then((d) => { if (!cancelled) setImageDataUrl(d) })
        return () => { cancelled = true }
    }, [imageFile])

    useEffect(() => {
        if (prefillFile && open) {
            if (isImageFile(prefillFile)) {
                setImageFile(prefillFile); setMode('image'); setType('painting'); setCategory('paintings')
            } else if (isGlbFile(prefillFile)) {
                setFile(prefillFile); setMode('file')
            }
        }
    }, [prefillFile, open])

    const reset = () => {
        setUrl(''); setFile(null); setImageFile(null); setImageDataUrl('')
        setTitle(''); setArtist(''); setYear(''); setDescription('')
        setScale(1); setType('statue'); setCategory('modern')
        setTiltXDeg(0); setTiltYDeg(0); setTiltZDeg(0); setYOffset(0)
        setAutoFillQuery(''); setAutoFillMsg(''); setError('')
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (imageInputRef.current) imageInputRef.current.value = ''
    }

    const resetTransforms = () => {
        setScale(1); setTiltXDeg(0); setTiltYDeg(0); setTiltZDeg(0); setYOffset(0)
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
            if (!seedTitle) { setAutoFillMsg('Type a work title (e.g. "Mona Lisa") or paste a Sketchfab URL.'); return }
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
                if (meta.title) {
                    try {
                        const wiki = await fetchWikipediaMeta(meta.title)
                        if (wiki.description) {
                            setDescription((prev) => prev || wiki.description)
                            const y = extractYear(wiki.description)
                            if (y) setYear((prev) => prev || y)
                        }
                    } catch {}
                }
            } else {
                const meta = await fetchWikipediaMeta(q)
                applyMeta(meta)
                setAutoFillMsg(`Filled from Wikipedia: "${meta.title}".`)
            }
        } catch {
            const seedTitle = q && !isUrl(q) ? q : (title.trim() || 'Untitled')
            setTitle((prev) => prev || seedTitle)
            setDescription((prev) => prev || buildPlaceholderDescription(seedTitle, artist, year))
            setAutoFillMsg("Couldn't find a match — filled with placeholder text you can edit.")
        } finally {
            setAutoFilling(false)
        }
    }

    // Live preview model — assembled from current form state
    const previewModel = useMemo(() => {
        const tilt = [rad(tiltXDeg), rad(tiltYDeg), rad(tiltZDeg)]
        const sc = Number(scale) || 1
        const yo = Number(yOffset) || 0
        if (mode === 'image') {
            if (!imageDataUrl) return null
            return { id: '__preview', type: 'painting', imageUrl: imageDataUrl, scale: sc, tilt, yOffset: yo }
        }
        if (mode === 'file') {
            if (!fileBlobUrl) return null
            return { id: '__preview', type, remoteUrl: fileBlobUrl, scale: sc, tilt, yOffset: yo }
        }
        if (mode === 'url') {
            const t = url.trim()
            if (!t || !/\.glb($|\?|#)/i.test(t)) return null
            return { id: '__preview', type, remoteUrl: t, scale: sc, tilt, yOffset: yo }
        }
        return null
    }, [mode, imageDataUrl, fileBlobUrl, url, type, scale, tiltXDeg, tiltYDeg, tiltZDeg, yOffset])

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        const id = `custom-${Date.now()}`
        const tilt = [rad(tiltXDeg), rad(tiltYDeg), rad(tiltZDeg)]
        const yo = Number(yOffset) || 0
        let payload = null

        if (mode === 'image') {
            if (!imageFile) { setError('Please choose an image (JPG, PNG or WebP).'); return }
            const dataUrl = imageDataUrl || (await readImageAsDataUrl(imageFile))
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
                    tilt, yOffset: yo,
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
                    tilt, yOffset: yo,
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
                    tilt, yOffset: yo,
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
                    <motion.div className={`dialog dialog-wide ${previewOpen && previewModel ? 'has-preview' : ''}`}
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="dialog-header">
                            <h2>Add a 3D Model</h2>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button type="button"
                                    className={`icon-btn ${previewOpen ? 'active' : ''}`}
                                    onClick={() => setPreviewOpen((v) => !v)}
                                    title={previewOpen ? 'Hide preview' : 'Show preview'}>
                                    {previewOpen ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                            </div>
                        </div>

                        <div className="dialog-body">
                            <div className="dialog-form-col">
                                <div className="dialog-tabs">
                                    <button type="button" className={mode === 'file' ? 'tab-active' : ''} onClick={() => { setMode('file'); setError('') }}>3D file</button>
                                    <button type="button" className={mode === 'url' ? 'tab-active' : ''} onClick={() => { setMode('url'); setError('') }}>3D URL</button>
                                    <button type="button" className={mode === 'image' ? 'tab-active' : ''} onClick={() => { setMode('image'); setError(''); setType('painting'); setCategory('paintings') }}>Image</button>
                                </div>

                                <p className="dialog-help">
                                    {mode === 'file' && <>Pick a <strong>.glb</strong> from your computer (or drag-and-drop one onto the page).</>}
                                    {mode === 'url' && <>Paste a direct <strong>.glb</strong> URL on a CORS-enabled CDN.</>}
                                    {mode === 'image' && <>Pick a <strong>JPG / PNG / WebP</strong> — we'll mount it as a framed painting on the wall.</>}
                                </p>

                                <form onSubmit={submit} className="dialog-form" id="add-model-form">
                                    <div className="autofill-block">
                                        <label className="autofill-label">
                                            <span>Smart autofill</span>
                                            <em className="autofill-hint">Sketchfab URL, work title, or artist — we'll search Wikipedia.</em>
                                        </label>
                                        <div className="autofill-row">
                                            <input type="text" value={autoFillQuery}
                                                onChange={(e) => { setAutoFillQuery(e.target.value); setAutoFillMsg('') }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runAutoFill() } }}
                                                placeholder='e.g. "The Thinker by Rodin"' />
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

                                    {mode !== 'image' && (
                                        <div className="dialog-row">
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
                                        </div>
                                    )}
                                    {mode === 'image' && (
                                        <label>
                                            <span>Section</span>
                                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                                {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
                                            </select>
                                        </label>
                                    )}

                                    {/* Transform sliders */}
                                    <div className="transform-block">
                                        <div className="transform-header">
                                            <span>Adjust</span>
                                            <button type="button" className="reset-link" onClick={resetTransforms} title="Reset to defaults">
                                                <RotateCcw size={11} /><span>Reset</span>
                                            </button>
                                        </div>
                                        <SliderRow label="Scale" value={scale} min={0.1} max={3} step={0.05} unit="×" onChange={setScale} />
                                        <SliderRow label="Tilt X" value={tiltXDeg} min={-180} max={180} step={1} unit="°" onChange={setTiltXDeg} />
                                        <SliderRow label="Tilt Y" value={tiltYDeg} min={-180} max={180} step={1} unit="°" onChange={setTiltYDeg} />
                                        <SliderRow label="Tilt Z" value={tiltZDeg} min={-180} max={180} step={1} unit="°" onChange={setTiltZDeg} />
                                        <SliderRow label="Height" value={yOffset} min={-2} max={2} step={0.05} unit="m" onChange={setYOffset} />
                                    </div>

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
                            </div>

                            {previewOpen && (
                                <div className="dialog-preview-col">
                                    {previewModel ? (
                                        <Suspense fallback={<div className="preview-empty">Loading preview…</div>}>
                                            <ModelPreview modelData={previewModel} />
                                        </Suspense>
                                    ) : (
                                        <div className="preview-empty">
                                            {mode === 'file' && 'Choose a .glb file to preview it here.'}
                                            {mode === 'url' && 'Paste a direct .glb URL above to preview it.'}
                                            {mode === 'image' && 'Choose an image to preview it as a painting.'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function SliderRow({ label, value, min, max, step, unit, onChange }) {
    return (
        <div className="slider-row">
            <span className="slider-label">{label}</span>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))} />
            <span className="slider-val">{Number(value).toFixed(step < 1 ? 2 : 0)}{unit}</span>
        </div>
    )
}
