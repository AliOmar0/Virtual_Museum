import React, { Suspense, useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Html,
    useProgress,
    Float,
    Center,
    BakeShadows,
    Preload
} from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, RotateCw, Info } from 'lucide-react'
import { modelsData } from './data/models'

// Import all models
import { Model as StarryNight } from '../HeroModels/TheStarryNight_painting'
import { Model as Angel } from '../HeroModels/Angel_old_marble_version'
import { Model as DeathCrowning } from '../HeroModels/Death_crowning_innocence_1896_Painting'
import { Model as Frank } from '../HeroModels/Frank'
import { Model as Laocoon } from '../HeroModels/Laocoon_and_his_sons'
import { Model as LouisXIV } from '../HeroModels/Louis_xiv_de_france_louvre_paris'
import { Model as Beksinski } from '../HeroModels/Painting_by_zdzislaw_beksinski_2'
import { Model as Thinker } from '../HeroModels/The_thinker_by_auguste_rodin'

const modelComponents = {
    "TheStarryNight_painting": StarryNight,
    "Angel_old_marble_version": Angel,
    "Death_crowning_innocence_1896_Painting": DeathCrowning,
    "Frank": Frank,
    "Laocoon_and_his_sons": Laocoon,
    "Louis_xiv_de_france_louvre_paris": LouisXIV,
    "Painting_by_zdzislaw_beksinski_2": Beksinski,
    "The_thinker_by_auguste_rodin": Thinker
};

const OFFSET_X = 4.2; // Slightly further right to avoid text

function FullScreenLoader() {
    const { progress } = useProgress()
    return (
        <div className="loader">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="logo"
                style={{ fontSize: '3rem', fontWeight: 100, letterSpacing: '15px' }}
            >
                MUSEUM
            </motion.div>
            <div className="loader-bar">
                <motion.div
                    className="loader-progress"
                    animate={{ width: `${progress}%` }}
                ></motion.div>
            </div>
        </div>
    )
}

function CanvasLoader() {
    return (
        <Html center>
            <div style={{ color: 'white', display: 'flex', gap: '10px', alignItems: 'center', width: '200px' }}>
                <Loader2 className="animate-spin" size={16} />
                <span style={{ fontSize: '0.6rem', letterSpacing: '4px', textTransform: 'uppercase' }}>Entering Gallery...</span>
            </div>
        </Html>
    )
}

function ModelContainer({ modelData }) {
    const ModelComponent = modelComponents[modelData.file];
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (modelData.type === 'statue' && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.15;
        }
    });

    return (
        <group position={[OFFSET_X, modelData.yOffset || 0, 0]}>
            <group ref={groupRef}>
                <Center>
                    <group scale={modelData.scale}>
                        <ModelComponent />
                    </group>
                </Center>
            </group>
        </group>
    );
}

function Lighting() {
    return (
        <>
            <ambientLight intensity={1.5} />
            <directionalLight
                position={[10, 10, 10]}
                intensity={2.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[OFFSET_X, 5, 5]} intensity={3} color="#ffffff" />
            <pointLight position={[-OFFSET_X, 5, 5]} intensity={1} color="#4444ff" />
            <spotLight
                position={[OFFSET_X, 10, 0]}
                intensity={4}
                angle={0.5}
                penumbra={1}
            />
        </>
    )
}

const App = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const currentModel = modelsData[currentIndex];
    const { progress } = useProgress();

    useEffect(() => {
        if (progress === 100) {
            const timer = setTimeout(() => setIsInitialLoad(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [progress]);

    const nextModel = () => {
        setCurrentIndex((prev) => (prev + 1) % modelsData.length);
    };

    const prevModel = () => {
        setCurrentIndex((prev) => (prev - 1 + modelsData.length) % modelsData.length);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#050505', overflow: 'hidden' }}>
            <AnimatePresence>
                {isInitialLoad && <FullScreenLoader key="main-loader" />}
            </AnimatePresence>

            {!isInitialLoad && (
                <>
                    <nav className="navbar">
                        <div className="logo">VIRTUAL MUSEUM</div>
                        <div className="navbar-links">
                            <span>GALLERY</span>
                            <span>COLLECTIONS</span>
                        </div>
                    </nav>

                    <div className="controls">
                        <button className="control-btn" onClick={prevModel}><ArrowLeft size={18} /></button>
                        <div className="index-counter">{(currentIndex + 1).toString().padStart(2, '0')} / {modelsData.length.toString().padStart(2, '0')}</div>
                        <button className="control-btn" onClick={nextModel}><ArrowRight size={18} /></button>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentModel.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="info-panel"
                        >
                            <div className="artist-badge">{currentModel.artist}</div>
                            <h1 className="model-title" style={{ fontSize: '4.5rem', lineHeight: 1 }}>{currentModel.title}</h1>
                            <div className="year-tag">{currentModel.year}</div>
                            <p className="model-description">
                                {currentModel.description}
                            </p>

                            <button className="details-btn">
                                <Info size={14} /> VIEW EXHIBIT DATA
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    <div className="canvas-container">
                        <Canvas
                            shadows
                            dpr={[1, 2]}
                            camera={{ position: [0, 0, 15], fov: 30 }}
                        >
                            <color attach="background" args={['#050505']} />
                            <fog attach="fog" args={['#050505', 10, 40]} />

                            <Suspense fallback={<CanvasLoader />}>
                                <Environment preset="night" intensity={0.8} />

                                <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.15}>
                                    <ModelContainer key={currentModel.id} modelData={currentModel} />
                                </Float>

                                <ContactShadows
                                    scale={30}
                                    blur={2}
                                    opacity={0.3}
                                    far={10}
                                    position={[OFFSET_X, -4, 0]}
                                />

                                <BakeShadows />
                            </Suspense>

                            {currentModel.type === 'statue' && (
                                <OrbitControls
                                    key={currentModel.id}
                                    enablePan={false}
                                    enableZoom={true}
                                    minDistance={5}
                                    maxDistance={30}
                                    target={[OFFSET_X, 0, 0]}
                                    makeDefault
                                />
                            )}

                            <Lighting />
                            <Preload all />
                        </Canvas>
                    </div>

                    <div className="drag-hint">
                        {currentModel.type === 'statue' ? <><RotateCw size={12} /> INTERACTIVE ROTATION</> : `FIXED EXHIBIT`}
                    </div>
                </>
            )}
        </div>
    )
}

export default App
