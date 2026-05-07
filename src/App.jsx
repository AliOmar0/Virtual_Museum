import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'
import { Eye, EyeOff, Search } from 'lucide-react'

import { modelsData as builtInModels } from './data/models'
import Navbar from './components/ui/Navbar'
import InfoPanel from './components/ui/InfoPanel'
import Controls from './components/ui/Controls'
import ThumbnailStrip from './components/ui/ThumbnailStrip'
import FullscreenBtn from './components/ui/FullscreenBtn'
import AudioBtn from './components/ui/AudioBtn'
import MusicBtn from './components/ui/MusicBtn'
import AddModelDialog from './components/ui/AddModelDialog'
import HelpOverlay from './components/ui/HelpOverlay'
import ShareDialog from './components/ui/ShareDialog'
import SearchFilterBar from './components/ui/SearchFilterBar'
import PerfHUD from './components/ui/PerfHUD'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { useLobbyMusic } from './hooks/useLobbyMusic'
import {
    loadCustomModels, saveCustomModel, deleteCustomModel, saveThumbnail,
} from './lib/modelStorage'
import { readFavorites, toggleFavorite } from './lib/favorites'

const ViewerScene = lazy(() => import('./scenes/ViewerScene'))
const WalkableScene = lazy(() => import('./scenes/WalkableScene'))
const GridScene = lazy(() => import('./scenes/GridScene'))

const SETTINGS_KEY = 'museum.settings.v1'
const TOUR_INTERVAL_MS = 9000

function FullScreenLoader() {
    const { progress } = useProgress()
    return (
        <motion.div className="loader" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <motion.div initial={{ opacity: 0, letterSpacing: '4px' }} animate={{ opacity: 1, letterSpacing: '15px' }} transition={{ duration: 1.2 }} className="loader-title">
                MUSEUM
            </motion.div>
            <div className="loader-bar">
                <motion.div className="loader-progress" animate={{ width: `${Math.max(progress, 5)}%` }} />
            </div>
            <div className="loader-pct">{Math.floor(progress)}%</div>
        </motion.div>
    )
}

function loadSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}

const VALID_MODES = ['viewer', 'walkable', 'grid']

function parseHash() {
    const h = (window.location.hash || '').replace(/^#/, '')
    if (!h) return {}
    try {
        const params = new URLSearchParams(h)
        const rawMode = params.get('m')
        const rawIndex = Number(params.get('i'))
        const rawLight = Number(params.get('l'))
        return {
            mode: VALID_MODES.includes(rawMode) ? rawMode : undefined,
            index: Number.isFinite(rawIndex) && rawIndex >= 0 ? Math.floor(rawIndex) : undefined,
            light: Number.isFinite(rawLight) ? Math.max(0, Math.min(1, rawLight)) : undefined,
        }
    } catch { return {} }
}

export default function App() {
    const persisted = useMemo(loadSettings, [])
    const fromHash = useMemo(parseHash, [])

    const [mode, setMode] = useState(
        VALID_MODES.includes(fromHash.mode) ? fromHash.mode
            : VALID_MODES.includes(persisted.mode) ? persisted.mode
            : 'viewer'
    )
    const [customModels, setCustomModels] = useState([])
    const [currentIndex, setCurrentIndex] = useState(
        Number.isFinite(fromHash.index) ? fromHash.index : 0
    )
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [droppedFile, setDroppedFile] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const [lightingValue, setLightingValue] = useState(() => {
        const v = fromHash.light !== undefined ? fromHash.light : persisted.light
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0
    })
    const [thumbVersion, setThumbVersion] = useState(0)
    const [descVisible, setDescVisible] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Suggestions UI
    const [favorites, setFavorites] = useState(() => readFavorites())
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [section, setSection] = useState('all')
    const [favoritesOnly, setFavoritesOnly] = useState(false)
    const [helpOpen, setHelpOpen] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)
    const [tourActive, setTourActive] = useState(false)
    const [perfOn, setPerfOn] = useState(false)
    const importInputRef = useRef(null)

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const { progress } = useProgress()
    const { enabled: audioOn, toggle: toggleAudio, disable: disableAudio } = useAmbientAudio()
    const {
        enabled: musicOn, toggle: toggleMusicRaw,
        volume: musicVolume, setVolume: setMusicVolume,
        disable: disableMusic,
    } = useLobbyMusic({ initialVolume: 0.35 })

    // Music and procedural drone are mutually exclusive — turning one on
    // gracefully fades out the other.
    const toggleMusic = useCallback(() => {
        if (!musicOn && audioOn) disableAudio()
        toggleMusicRaw()
    }, [musicOn, audioOn, disableAudio, toggleMusicRaw])

    const toggleAudioExclusive = useCallback(() => {
        if (!audioOn && musicOn) disableMusic()
        toggleAudio()
    }, [audioOn, musicOn, disableMusic, toggleAudio])

    const models = useMemo(() => [...builtInModels, ...customModels], [customModels])
    const currentModel = models[currentIndex] || models[0]

    // Filtered list for thumbnail strip + nav
    const visibleModels = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        return models.filter((m) => {
            if (section !== 'all' && m.category !== section) return false
            if (favoritesOnly && !favorites.has(m.id)) return false
            if (!q) return true
            const hay = `${m.title} ${m.artist} ${m.description || ''} ${m.year || ''}`.toLowerCase()
            return hay.includes(q)
        })
    }, [models, searchQuery, section, favoritesOnly, favorites])

    useEffect(() => {
        let cancelled = false
        loadCustomModels().then((loaded) => {
            if (!cancelled && loaded.length) setCustomModels(loaded)
        }).catch(() => {})
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode, light: lightingValue }))
        } catch {}
    }, [mode, lightingValue])

    useEffect(() => {
        const params = new URLSearchParams()
        params.set('m', mode)
        params.set('i', String(currentIndex))
        params.set('l', String(Math.round(lightingValue * 100) / 100))
        const newHash = '#' + params.toString()
        if (window.location.hash !== newHash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash)
        }
    }, [mode, currentIndex, lightingValue])

    useEffect(() => {
        if (progress >= 100) {
            const t = setTimeout(() => setIsInitialLoad(false), 800)
            return () => clearTimeout(t)
        }
    }, [progress])
    useEffect(() => {
        const t = setTimeout(() => setIsInitialLoad(false), 1500)
        return () => clearTimeout(t)
    }, [])

    // Navigation respects current filter
    const next = useCallback(() => {
        const list = visibleModels.length ? visibleModels : models
        setCurrentIndex((ci) => {
            const cur = models[ci]
            const inListIdx = list.findIndex((m) => m.id === cur?.id)
            const nextInList = list[(inListIdx + 1 + list.length) % list.length]
            return models.findIndex((m) => m.id === nextInList.id)
        })
    }, [models, visibleModels])

    const prev = useCallback(() => {
        const list = visibleModels.length ? visibleModels : models
        setCurrentIndex((ci) => {
            const cur = models[ci]
            const inListIdx = list.findIndex((m) => m.id === cur?.id)
            const prevInList = list[(inListIdx - 1 + list.length) % list.length]
            return models.findIndex((m) => m.id === prevInList.id)
        })
    }, [models, visibleModels])

    const selectById = useCallback((id) => {
        const idx = models.findIndex((m) => m.id === id)
        if (idx >= 0) setCurrentIndex(idx)
    }, [models])

    // Keyboard
    useEffect(() => {
        const onKey = (e) => {
            if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
            if (e.key === 'ArrowRight') next()
            else if (e.key === 'ArrowLeft') prev()
            else if (e.key === '1') setMode('viewer')
            else if (e.key === '2') setMode('walkable')
            else if (e.key === '3') setMode('grid')
            else if (e.key === 'i' || e.key === 'I') setDescVisible((v) => !v)
            else if (e.key === '?') setHelpOpen(true)
            else if (e.key === '/') { e.preventDefault(); setSearchOpen(true) }
            else if (e.key === 't' || e.key === 'T') setTourActive((v) => !v)
            else if (e.key === 'f' || e.key === 'F') {
                if (document.fullscreenElement) document.exitFullscreen?.()
                else document.documentElement.requestFullscreen?.()
            }
            else if (e.key === 'Escape') {
                setHelpOpen(false); setShareOpen(false); setSearchOpen(false)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [next, prev])

    // Guided tour
    useEffect(() => {
        if (!tourActive) return
        const id = setInterval(() => next(), TOUR_INTERVAL_MS)
        return () => clearInterval(id)
    }, [tourActive, next])

    const handleAdd = useCallback(async ({ model, file }) => {
        const tagged = { ...model, _custom: true }
        setCustomModels((prev) => [...prev, tagged])
        setCurrentIndex(models.length)
        setDroppedFile(null)
        try { await saveCustomModel(tagged, file) } catch (err) { console.warn('persist failed', err) }
    }, [models.length])

    const handleDelete = useCallback(async (id) => {
        const idx = models.findIndex((m) => m.id === id)
        setCustomModels((prev) => {
            const removed = prev.find((m) => m.id === id)
            if (removed?.remoteUrl?.startsWith('blob:')) {
                try { URL.revokeObjectURL(removed.remoteUrl) } catch {}
            }
            return prev.filter((m) => m.id !== id)
        })
        setCurrentIndex((ci) => {
            if (idx === -1) return ci
            if (ci > idx) return ci - 1
            if (ci === idx) return Math.max(0, ci - 1)
            return ci
        })
        try { await deleteCustomModel(id) } catch {}
    }, [models])

    const handleCaptureThumbnail = useCallback((id, dataUrl) => {
        saveThumbnail(id, dataUrl)
        setThumbVersion((v) => v + 1)
    }, [])

    const handleToggleFavorite = useCallback((id) => {
        setFavorites((prev) => toggleFavorite(prev, id))
    }, [])

    // Export / Import gallery JSON
    const handleExport = useCallback(() => {
        const safe = customModels.map((m) => {
            const { remoteUrl, ...rest } = m
            // Only export shareable models (URL-based or image-based, not local file blobs)
            if (m.imageUrl) return { ...rest, imageUrl: m.imageUrl }
            if (remoteUrl && !remoteUrl.startsWith('blob:')) return { ...rest, remoteUrl }
            return null
        }).filter(Boolean)
        const data = {
            exported: new Date().toISOString(),
            favorites: [...favorites],
            customModels: safe,
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `museum-gallery-${Date.now()}.json`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, [customModels, favorites])

    const handleImport = useCallback(() => {
        importInputRef.current?.click()
    }, [])

    const onImportFile = useCallback(async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        try {
            const text = await f.text()
            const data = JSON.parse(text)
            const incoming = Array.isArray(data.customModels) ? data.customModels : []
            for (const m of incoming) {
                const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
                const model = { ...m, id, _custom: true }
                setCustomModels((prev) => [...prev, model])
                try { await saveCustomModel(model, null) } catch {}
            }
            if (Array.isArray(data.favorites)) {
                const merged = new Set([...favorites, ...data.favorites])
                setFavorites(merged)
                try { localStorage.setItem('museum.favorites.v1', JSON.stringify([...merged])) } catch {}
            }
        } catch (err) {
            alert('Could not read that gallery file.')
        } finally {
            if (importInputRef.current) importInputRef.current.value = ''
        }
    }, [favorites])

    // Drag-and-drop .glb / image anywhere on the page
    useEffect(() => {
        const onDragOver = (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault(); setDragOver(true)
            }
        }
        const onDragLeave = (e) => { if (e.relatedTarget === null) setDragOver(false) }
        const onDrop = (e) => {
            e.preventDefault(); setDragOver(false)
            const f = e.dataTransfer?.files?.[0]
            if (f && (/\.glb$/i.test(f.name) || /\.(png|jpe?g|webp|avif)$/i.test(f.name))) {
                setDroppedFile(f); setDialogOpen(true)
            }
        }
        window.addEventListener('dragover', onDragOver)
        window.addEventListener('dragleave', onDragLeave)
        window.addEventListener('drop', onDrop)
        return () => {
            window.removeEventListener('dragover', onDragOver)
            window.removeEventListener('dragleave', onDragLeave)
            window.removeEventListener('drop', onDrop)
        }
    }, [])

    const shareUrl = window.location.origin + window.location.pathname + window.location.search + window.location.hash

    return (
        <div className={`app-root ${dragOver ? 'drag-over' : ''} ${isFullscreen ? 'is-fullscreen' : ''}`}>
            <AnimatePresence>
                {isInitialLoad && <FullScreenLoader key="boot" />}
            </AnimatePresence>

            <Navbar
                mode={mode}
                onModeChange={setMode}
                onAddModel={() => setDialogOpen(true)}
                lightingValue={lightingValue}
                onLightingChange={setLightingValue}
                tourActive={tourActive}
                onToggleTour={() => setTourActive((v) => !v)}
                onHelp={() => setHelpOpen(true)}
                onShare={() => setShareOpen(true)}
                onExport={handleExport}
                onImport={handleImport}
                perfOn={perfOn}
                onTogglePerf={() => setPerfOn((v) => !v)}
            />

            <div className="canvas-container">
                <Suspense fallback={null}>
                    {mode === 'viewer' && (
                        <ViewerScene
                            key={`v-${currentModel.id}`}
                            modelData={currentModel}
                            lightingValue={lightingValue}
                            onCaptureThumbnail={handleCaptureThumbnail}
                        />
                    )}
                    {mode === 'walkable' && (
                        <WalkableScene
                            models={models}
                            currentIndex={currentIndex}
                            lightingValue={lightingValue}
                        />
                    )}
                    {mode === 'grid' && (
                        <GridScene
                            models={models}
                            currentIndex={currentIndex}
                            onSelect={setCurrentIndex}
                            lightingValue={lightingValue}
                        />
                    )}
                </Suspense>
            </div>

            <AnimatePresence mode="wait">
                <InfoPanel
                    key={currentModel.id + mode}
                    model={currentModel}
                    compact={mode !== 'viewer'}
                    showDescription={descVisible}
                    onDelete={handleDelete}
                    isFavorite={favorites.has(currentModel.id)}
                    onToggleFavorite={handleToggleFavorite}
                />
            </AnimatePresence>

            {tourActive && (
                <div className="tour-banner">
                    <span className="tour-dot" />
                    Guided tour — auto-advancing every {Math.round(TOUR_INTERVAL_MS / 1000)}s · press T to stop
                </div>
            )}

            {perfOn && <PerfHUD />}

            <SearchFilterBar
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                query={searchQuery}
                onQuery={setSearchQuery}
                section={section}
                onSection={setSection}
                favoritesOnly={favoritesOnly}
                onToggleFavorites={() => setFavoritesOnly((v) => !v)}
                resultCount={visibleModels.length}
                totalCount={models.length}
            />

            <div className="bottom-bar">
                <button
                    className={`icon-btn search-toggle ${searchOpen ? 'active' : ''}`}
                    onClick={() => setSearchOpen((v) => !v)}
                    aria-label="Search & filter"
                    title="Search & filter (/)"
                >
                    <Search size={14} />
                </button>
                <Controls index={currentIndex} total={models.length} onPrev={prev} onNext={next} />
                <ThumbnailStrip
                    models={visibleModels}
                    currentId={currentModel?.id}
                    onSelect={selectById}
                    thumbVersion={thumbVersion}
                    favorites={favorites}
                />
                <div className="utility-cluster">
                    <button
                        className={`icon-btn ${descVisible ? 'active' : ''}`}
                        onClick={() => setDescVisible((v) => !v)}
                        aria-label={descVisible ? 'Hide description' : 'Show description'}
                        title={descVisible ? 'Hide description (I)' : 'Show description (I)'}
                    >
                        {descVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <MusicBtn
                        enabled={musicOn}
                        onToggle={toggleMusic}
                        volume={musicVolume}
                        onVolumeChange={setMusicVolume}
                    />
                    <AudioBtn enabled={audioOn} onToggle={toggleAudioExclusive} />
                    <FullscreenBtn />
                </div>
            </div>

            <div className="hint">
                {mode === 'viewer' && 'Drag to rotate · Scroll to zoom · ← → switch · ? for help'}
                {mode === 'walkable' && 'Drag to look · ← → walk between exhibits · ? for help'}
                {mode === 'grid' && 'Click any exhibit · Drag to orbit · ? for help'}
            </div>

            {dragOver && (
                <div className="drop-overlay">
                    <div className="drop-hint">Drop a <strong>.glb</strong> or <strong>image</strong> to add it</div>
                </div>
            )}

            <AddModelDialog
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setDroppedFile(null) }}
                onAdd={handleAdd}
                prefillFile={droppedFile}
            />
            <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
            <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} url={shareUrl} />

            <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={onImportFile}
            />
        </div>
    )
}
