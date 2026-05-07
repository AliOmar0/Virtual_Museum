import React, { Suspense, lazy, useEffect, useRef, useMemo, Component } from 'react'
import { useGLTF, Center, Html } from '@react-three/drei'
import * as THREE from 'three'

const enhancedMaterials = new WeakSet()

const builtInModels = {
    "TheStarryNight_painting": lazy(() =>
        import('../../HeroModels/TheStarryNight_painting').then((m) => ({ default: m.Model }))
    ),
    "Angel_old_marble_version": lazy(() =>
        import('../../HeroModels/Angel_old_marble_version').then((m) => ({ default: m.Model }))
    ),
    "Death_crowning_innocence_1896_Painting": lazy(() =>
        import('../../HeroModels/Death_crowning_innocence_1896_Painting').then((m) => ({ default: m.Model }))
    ),
    "Frank": lazy(() =>
        import('../../HeroModels/Frank').then((m) => ({ default: m.Model }))
    ),
    "Laocoon_and_his_sons": lazy(() =>
        import('../../HeroModels/Laocoon_and_his_sons').then((m) => ({ default: m.Model }))
    ),
    "Louis_xiv_de_france_louvre_paris": lazy(() =>
        import('../../HeroModels/Louis_xiv_de_france_louvre_paris').then((m) => ({ default: m.Model }))
    ),
    "Painting_by_zdzislaw_beksinski_2": lazy(() =>
        import('../../HeroModels/Painting_by_zdzislaw_beksinski_2').then((m) => ({ default: m.Model }))
    ),
    "The_thinker_by_auguste_rodin": lazy(() =>
        import('../../HeroModels/The_thinker_by_auguste_rodin').then((m) => ({ default: m.Model }))
    ),
}

function RemoteGLB({ url }) {
    const { scene } = useGLTF(url)
    const cloned = useMemo(() => scene.clone(true), [scene])
    return <primitive object={cloned} />
}

function enhanceMaterials(root) {
    root.traverse((obj) => {
        if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
            mats.forEach((m) => {
                if (!m || enhancedMaterials.has(m)) return
                if (m.map) {
                    m.map.anisotropy = 8
                    m.map.colorSpace = THREE.SRGBColorSpace
                }
                if ('envMapIntensity' in m) m.envMapIntensity = 1.1
                if ('roughness' in m && m.roughness === 0) m.roughness = 0.4
                m.needsUpdate = true
                enhancedMaterials.add(m)
            })
        }
    })
}

class GLBErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false } }
    static getDerivedStateFromError() { return { hasError: true } }
    componentDidCatch(err) { console.warn('Model failed to load:', err) }
    render() {
        if (this.state.hasError) {
            return (
                <Html center>
                    <div className="canvas-loading" style={{ background: 'rgba(80,20,20,0.7)' }}>
                        <span>Failed to load model</span>
                    </div>
                </Html>
            )
        }
        return this.props.children
    }
}

/**
 * Renders a model from the built-in registry or from a remote .glb URL.
 * Auto-centers and applies shadow + material polish.
 */
export function ModelDisplay({ modelData, alignBottom = false, scale = 1 }) {
    const groupRef = useRef()
    const ModelComp = !modelData.remoteUrl ? builtInModels[modelData.file] : null

    useEffect(() => {
        if (groupRef.current) enhanceMaterials(groupRef.current)
    })

    const modelScale = (modelData.scale || 1) * scale

    return (
        <group ref={groupRef}>
            <Center
                {...(alignBottom ? { bottom: true } : {})}
                cacheKey={modelData.id + (alignBottom ? '-b' : '')}
            >
                <group scale={modelScale}>
                    <GLBErrorBoundary>
                        <Suspense fallback={null}>
                            {modelData.remoteUrl ? (
                                <RemoteGLB url={modelData.remoteUrl} />
                            ) : ModelComp ? (
                                <ModelComp />
                            ) : null}
                        </Suspense>
                    </GLBErrorBoundary>
                </group>
            </Center>
        </group>
    )
}

export function ModelLoadingFallback() {
    return (
        <Html center>
            <div className="canvas-loading">
                <div className="canvas-loading-dot" />
                <span>Loading exhibit…</span>
            </div>
        </Html>
    )
}
