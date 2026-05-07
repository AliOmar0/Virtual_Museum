import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react'
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
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { loadCustomModels, saveCustomModel, deleteCustomModel } from './lib/modelStorage'

const ViewerScene = lazy(() => import('./scenes/ViewerScene'))
const WalkableScene = lazy(() => import('./scenes/WalkableScene'))
const GridScene = lazy(() => import('./scenes/GridScene'))

const DRAMATIC_KEY = 'museum.dramaticLighting'

function FullScreenLoader() {
    const { progress } = useProgress()
    return (
        <motion.div
            className="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            <motion.div
                initial={{ opacity: 0, letterSpacing: '4px' }}
                animate={{ opacity: 1, letterSpacing: '15px' }}
                transition={{ duration: 1.2 }}
                className="loader-title"
            >
                MUSEUM
            </motion.div>
            <div className="loader-bar">
                <motion.div
                    className="loader-progress"
                    animate={{ width: `${Math.max(progress, 5)}%` }}
                />
            </div>
            <div className="loader-pct">{Math.floor(progress)}%</div>
        </motion.div>
    )
}

export default function App() {
    const [mode, setMode] = useState('viewer')
    const [customModels, setCustomModels] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dramatic, setDramatic] = useState(() => {
        try { return localStorage.getItem(DRAMATIC_KEY) === '1' } catch { return false }
    })
    const { progress } = useProgress()
    const { enabled: audioOn, toggle: toggleAudio } = useAmbientAudio()

    const models = useMemo(() => [...builtInModels, ...customModels], [customModels])
    const currentModel = models[currentIndex] || models[0]

    // Hydrate persisted custom models on first load
    useEffect(() => {
        let cancelled = false
        loadCustomModels().then((loaded) => {
            if (!cancelled && loaded.length) setCustomModels(loaded)
        }).catch(() => { /* ignore */ })
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        try { localStorage.setItem(DRAMATIC_KEY, dramatic ? '1' : '0') } catch { /* ignore */ }
    }, [dramatic])

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
            else if (e.key === 'l' || e.key === 'L') setDramatic((d) => !d)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [models.length])

    const next = () => setCurrentIndex((i) => (i + 1) % models.length)
    const prev = () => setCurrentIndex((i) => (i - 1 + models.length) % models.length)

    const handleAdd = useCallback(async ({ model, file }) => {
        // Mark as user-added so the InfoPanel offers a delete button
        const tagged = { ...model, _custom: true }
        setCustomModels((prev) => [...prev, tagged])
        setCurrentIndex(models.length)
        try {
            await saveCustomModel(tagged, file)
        } catch (err) {
            console.warn('Failed to persist custom model:', err)
        }
    }, [models.length])

    const handleDelete = useCallback(async (id) => {
        const idx = models.findIndex((m) => m.id === id)
        setCustomModels((prev) => {
            const next = prev.filter((m) => m.id !== id)
            // Revoke blob URL if it was a local upload
            const removed = prev.find((m) => m.id === id)
            if (removed?.remoteUrl?.startsWith('blob:')) {
                try { URL.revokeObjectURL(removed.remoteUrl) } catch { /* ignore */ }
            }
            return next
        })
        // Adjust currentIndex if needed
        setCurrentIndex((ci) => {
            if (idx === -1) return ci
            if (ci > idx) return ci - 1
            if (ci === idx) return Math.max(0, ci - 1)
            return ci
        })
        try { await deleteCustomModel(id) } catch { /* ignore */ }
    }, [models])

    return (
        <div className="app-root">
            <AnimatePresence>
                {isInitialLoad && <FullScreenLoader key="boot" />}
            </AnimatePresence>

            <Navbar
                mode={mode}
                onModeChange={setMode}
                onAddModel={() => setDialogOpen(true)}
                dramatic={dramatic}
                onToggleDramatic={() => setDramatic((d) => !d)}
            />

            <div className="canvas-container">
                <Suspense fallback={null}>
                    {mode === 'viewer' && (
                        <ViewerScene key={`v-${currentModel.id}`} modelData={currentModel} dramatic={dramatic} />
                    )}
                    {mode === 'walkable' && (
                        <WalkableScene models={models} currentIndex={currentIndex} dramatic={dramatic} />
                    )}
                    {mode === 'grid' && (
                        <GridScene
                            models={models}
                            currentIndex={currentIndex}
                            onSelect={setCurrentIndex}
                            dramatic={dramatic}
                        />
                    )}
                </Suspense>
            </div>

            <AnimatePresence mode="wait">
                <InfoPanel
                    key={currentModel.id + mode}
                    model={currentModel}
                    compact={mode !== 'viewer'}
                    onDelete={handleDelete}
                />
            </AnimatePresence>

            <div className="bottom-bar">
                <Controls
                    index={currentIndex}
                    total={models.length}
                    onPrev={prev}
                    onNext={next}
                />
                <ThumbnailStrip
                    models={models}
                    currentIndex={currentIndex}
                    onSelect={setCurrentIndex}
                />
                <div className="utility-cluster">
                    <AudioBtn enabled={audioOn} onToggle={toggleAudio} />
                    <FullscreenBtn />
                </div>
            </div>

            <div className="hint">
                {mode === 'viewer' && 'Drag to rotate · Scroll to zoom · ← → to switch · L for lighting'}
                {mode === 'walkable' && 'Drag to look · Scroll to move closer · ← → to walk · L for lighting'}
                {mode === 'grid' && 'Click any exhibit to focus · Drag to orbit · ← → · L for lighting'}
            </div>

            <AddModelDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onAdd={handleAdd}
            />
        </div>
    )
}
