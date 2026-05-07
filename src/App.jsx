import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

import { modelsData as builtInModels } from './data/models'
import Navbar from './components/ui/Navbar'
import InfoPanel from './components/ui/InfoPanel'
import Controls from './components/ui/Controls'
import ThumbnailStrip from './components/ui/ThumbnailStrip'
import FullscreenBtn from './components/ui/FullscreenBtn'
import AudioBtn from './components/ui/AudioBtn'
import AddModelDialog from './components/ui/AddModelDialog'
import Minimap from './components/ui/Minimap'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import {
    loadCustomModels, saveCustomModel, deleteCustomModel, saveThumbnail,
} from './lib/modelStorage'

const ViewerScene = lazy(() => import('./scenes/ViewerScene'))
const WalkableScene = lazy(() => import('./scenes/WalkableScene'))
const GridScene = lazy(() => import('./scenes/GridScene'))

// Static import only the lightweight layout helper, so the minimap doesn't
// pull the entire walkable scene into the main bundle. (WalkableScene is still
// lazy-loaded for its render path.)
import { computeWalkableLayout } from './scenes/walkableLayout'

const SETTINGS_KEY = 'museum.settings.v1'

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
    try {
        const raw = localStorage.getItem(SETTINGS_KEY)
        return raw ? JSON.parse(raw) : {}
    } catch { return {} }
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
    const [walkMode, setWalkMode] = useState(false)
    const [minimapOn, setMinimapOn] = useState(persisted.minimap ?? true)
    const [cameraPose, setCameraPose] = useState({ x: 0, z: 4, yaw: 0 })
    const [thumbVersion, setThumbVersion] = useState(0)

    const { progress } = useProgress()
    const { enabled: audioOn, toggle: toggleAudio } = useAmbientAudio()

    const models = useMemo(() => [...builtInModels, ...customModels], [customModels])
    const currentModel = models[currentIndex] || models[0]

    // Hydrate persisted custom models
    useEffect(() => {
        let cancelled = false
        loadCustomModels().then((loaded) => {
            if (!cancelled && loaded.length) setCustomModels(loaded)
        }).catch(() => {})
        return () => { cancelled = true }
    }, [])

    // Persist UI prefs
    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                mode, light: lightingValue, minimap: minimapOn,
            }))
        } catch {}
    }, [mode, lightingValue, minimapOn])

    // Sync URL hash so the current view is shareable
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

    useEffect(() => {
        const onKey = (e) => {
            if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
            if (e.key === 'ArrowRight') setCurrentIndex((i) => (i + 1) % models.length)
            else if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i - 1 + models.length) % models.length)
            else if (e.key === '1') setMode('viewer')
            else if (e.key === '2') setMode('walkable')
            else if (e.key === '3') setMode('grid')
            else if (e.key === 'm' || e.key === 'M') setMinimapOn((v) => !v)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [models.length])

    const next = () => setCurrentIndex((i) => (i + 1) % models.length)
    const prev = () => setCurrentIndex((i) => (i - 1 + models.length) % models.length)

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

    // Drag-and-drop a .glb anywhere on the page → open dialog with file prefilled
    useEffect(() => {
        const onDragOver = (e) => {
            if (e.dataTransfer?.types?.includes('Files')) {
                e.preventDefault()
                setDragOver(true)
            }
        }
        const onDragLeave = (e) => {
            if (e.relatedTarget === null) setDragOver(false)
        }
        const onDrop = (e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer?.files?.[0]
            if (f && /\.glb$/i.test(f.name)) {
                setDroppedFile(f)
                setDialogOpen(true)
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

    // Minimap layout — recomputed when models change
    const minimapLayout = useMemo(() => {
        if (mode !== 'walkable') return null
        return computeWalkableLayout(models)
    }, [mode, models])

    const handleCameraMove = useCallback((x, z, yaw) => {
        setCameraPose({ x, z, yaw })
    }, [])

    return (
        <div className={`app-root ${dragOver ? 'drag-over' : ''}`}>
            <AnimatePresence>
                {isInitialLoad && <FullScreenLoader key="boot" />}
            </AnimatePresence>

            <Navbar
                mode={mode}
                onModeChange={setMode}
                onAddModel={() => setDialogOpen(true)}
                lightingValue={lightingValue}
                onLightingChange={setLightingValue}
                minimapOn={minimapOn}
                onToggleMinimap={() => setMinimapOn((v) => !v)}
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
                            walkMode={walkMode}
                            onCameraMove={handleCameraMove}
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

            {/* Walk-mode toggle (gallery only) */}
            {mode === 'walkable' && (
                <div className="walk-toggle">
                    <button
                        className={`mode-btn ${walkMode ? 'active' : ''}`}
                        onClick={() => setWalkMode((v) => !v)}
                        title={walkMode ? 'Exit walk mode (press Esc to release pointer)' : 'Walk freely with WASD + mouse'}
                    >
                        {walkMode ? 'Exit Walk' : 'Walk Mode'}
                    </button>
                    {walkMode && (
                        <div className="walk-help">Click canvas to capture pointer · WASD to move · Shift to sprint · Esc to release</div>
                    )}
                </div>
            )}

            {/* Minimap (gallery only) */}
            {mode === 'walkable' && minimapOn && minimapLayout && (
                <Minimap
                    roomWidth={minimapLayout.roomWidth}
                    roomDepth={minimapLayout.roomDepth}
                    placements={minimapLayout.placements}
                    currentIndex={currentIndex}
                    cameraX={cameraPose.x}
                    cameraZ={cameraPose.z}
                    cameraYaw={cameraPose.yaw}
                />
            )}

            <AnimatePresence mode="wait">
                <InfoPanel
                    key={currentModel.id + mode}
                    model={currentModel}
                    compact={mode !== 'viewer'}
                    onDelete={handleDelete}
                />
            </AnimatePresence>

            <div className="bottom-bar">
                <Controls index={currentIndex} total={models.length} onPrev={prev} onNext={next} />
                <ThumbnailStrip
                    models={models}
                    currentIndex={currentIndex}
                    onSelect={setCurrentIndex}
                    thumbVersion={thumbVersion}
                />
                <div className="utility-cluster">
                    <AudioBtn enabled={audioOn} onToggle={toggleAudio} />
                    <FullscreenBtn />
                </div>
            </div>

            <div className="hint">
                {mode === 'viewer' && 'Drag to rotate · Scroll to zoom · ← → to switch'}
                {mode === 'walkable' && (walkMode ? 'WASD to move · Mouse to look · Esc to release' : 'Drag to look · ← → to walk · M for map')}
                {mode === 'grid' && 'Click any exhibit · Drag to orbit · ← →'}
            </div>

            {dragOver && (
                <div className="drop-overlay">
                    <div className="drop-hint">Drop a <strong>.glb</strong> file to add it as an exhibit</div>
                </div>
            )}

            <AddModelDialog
                open={dialogOpen}
                onClose={() => { setDialogOpen(false); setDroppedFile(null) }}
                onAdd={handleAdd}
                prefillFile={droppedFile}
            />
        </div>
    )
}
