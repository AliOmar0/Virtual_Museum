import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'
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

const ViewerScene = lazy(() => import('./scenes/ViewerScene'))
const WalkableScene = lazy(() => import('./scenes/WalkableScene'))
const GridScene = lazy(() => import('./scenes/GridScene'))

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
    const [mode, setMode] = useState('viewer') // 'viewer' | 'walkable' | 'grid'
    const [customModels, setCustomModels] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { progress } = useProgress()
    const { enabled: audioOn, toggle: toggleAudio } = useAmbientAudio()

    const models = useMemo(() => [...builtInModels, ...customModels], [customModels])
    const currentModel = models[currentIndex] || models[0]

    useEffect(() => {
        if (progress >= 100) {
            const t = setTimeout(() => setIsInitialLoad(false), 800)
            return () => clearTimeout(t)
        }
    }, [progress])

    // Safety net — if Three never reports progress (e.g., WebGL unavailable), reveal UI after 1.5s
    useEffect(() => {
        const t = setTimeout(() => setIsInitialLoad(false), 1500)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') setCurrentIndex((i) => (i + 1) % models.length)
            else if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i - 1 + models.length) % models.length)
            else if (e.key === '1') setMode('viewer')
            else if (e.key === '2') setMode('walkable')
            else if (e.key === '3') setMode('grid')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [models.length])

    const next = () => setCurrentIndex((i) => (i + 1) % models.length)
    const prev = () => setCurrentIndex((i) => (i - 1 + models.length) % models.length)
    const handleAdd = (m) => {
        setCustomModels((prev) => [...prev, m])
        setCurrentIndex(models.length) // jump to new one (current models length before update == new index)
    }

    return (
        <div className="app-root">
            <AnimatePresence>
                {isInitialLoad && <FullScreenLoader key="boot" />}
            </AnimatePresence>

            <Navbar
                mode={mode}
                onModeChange={setMode}
                onAddModel={() => setDialogOpen(true)}
            />

            <div className="canvas-container">
                <Suspense fallback={null}>
                    {mode === 'viewer' && (
                        <ViewerScene key={`v-${currentModel.id}`} modelData={currentModel} />
                    )}
                    {mode === 'walkable' && (
                        <WalkableScene models={models} currentIndex={currentIndex} />
                    )}
                    {mode === 'grid' && (
                        <GridScene
                            models={models}
                            currentIndex={currentIndex}
                            onSelect={setCurrentIndex}
                        />
                    )}
                </Suspense>
            </div>

            <AnimatePresence mode="wait">
                <InfoPanel key={currentModel.id + mode} model={currentModel} compact={mode !== 'viewer'} />
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
                {mode === 'viewer' && 'Drag to rotate · Scroll to zoom · ← → to switch'}
                {mode === 'walkable' && 'Drag to look · Scroll to move closer · ← → to walk'}
                {mode === 'grid' && 'Click any exhibit to focus · Drag to orbit · ← →'}
            </div>

            <AddModelDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onAdd={handleAdd}
            />
        </div>
    )
}
