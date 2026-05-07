import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Float,
} from '@react-three/drei'
import * as THREE from 'three'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'

const lerp = (a, b, t) => a + (b - a) * t

function CameraRig({ isPainting }) {
    const { camera } = useThree()
    useEffect(() => {
        if (isPainting) {
            camera.position.set(0, 1.6, 5)
            camera.lookAt(0, 1.6, 0)
        } else {
            camera.position.set(0, 1.3, 4.5)
            camera.lookAt(0, 1.0, 0)
        }
    }, [camera, isPainting])
    return null
}

/**
 * Captures a thumbnail of the rendered model once after AutoFit settles.
 * Each component instance fires at most one capture, then becomes inert.
 */
function ThumbnailCapturer({ modelId, enabled, onCaptured }) {
    const { gl, scene, camera } = useThree()
    const doneRef = useRef(false)
    useEffect(() => {
        doneRef.current = false
    }, [modelId])
    useEffect(() => {
        if (!enabled || !modelId) return
        const t = setTimeout(() => {
            if (doneRef.current) return
            try {
                gl.render(scene, camera)
                const url = gl.domElement.toDataURL('image/png')
                doneRef.current = true
                onCaptured(modelId, url)
            } catch { /* ignore */ }
        }, 1500)
        return () => clearTimeout(t)
    }, [enabled, modelId, gl, scene, camera, onCaptured])
    return null
}

export default function ViewerScene({ modelData, lightingValue = 0, onCaptureThumbnail }) {
    const isPainting = modelData.type === 'painting'
    const exposure = lerp(1.0, 0.85, lightingValue)
    const ambient = lerp(0.3, 0.06, lightingValue)
    const hemi = lerp(0.35, 0.08, lightingValue)
    const env = lerp(0.4, 0.12, lightingValue)
    const dir = lerp(1.0, 0.4, lightingValue)
    const accent = lerp(0.5, 0.2, lightingValue)
    const bg = lightingValue > 0.5 ? '#020202' : '#070605'
    const fogN = lerp(14, 8, lightingValue)
    const fogF = lerp(40, 26, lightingValue)

    // Only capture thumbnails for user-added models (built-ins ship with their own static thumbnails)
    const captureEnabled = !!(modelData._custom && onCaptureThumbnail)

    return (
        <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: exposure,
                preserveDrawingBuffer: captureEnabled,
            }}
            camera={{ position: [0, 1.3, 4.5], fov: 40 }}
        >
            <color attach="background" args={[bg]} />
            <fog attach="fog" args={[bg, fogN, fogF]} />

            <CameraRig isPainting={isPainting} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={env} />

                <ambientLight intensity={ambient} />
                <hemisphereLight args={['#fff1d6', '#1a1410', hemi]} />

                <directionalLight
                    position={[6, 8, 5]}
                    intensity={dir}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-bias={-0.0005}
                />
                <pointLight position={[-5, 3, -3]} intensity={accent} color="#5577aa" />

                {isPainting ? (
                    <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.05}>
                        <Exhibit
                            modelData={modelData}
                            position={[0, 1.6, 0]}
                            withSpotlight
                            withPedestal={false}
                            castShadowSpot
                            targetSize={2.6}
                        />
                    </Float>
                ) : (
                    <Exhibit
                        modelData={modelData}
                        position={[0, 0, 0]}
                        autoRotate
                        withSpotlight
                        withPedestal={false}
                        castShadowSpot
                        targetSize={2.0}
                    />
                )}

                <ContactShadows
                    scale={14}
                    blur={2.5}
                    opacity={0.5}
                    far={6}
                    position={[0, 0.01, 0]}
                />

                <ThumbnailCapturer
                    modelId={modelData.id}
                    enabled={captureEnabled}
                    onCaptured={onCaptureThumbnail}
                />
            </Suspense>

            <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={2.5}
                maxDistance={14}
                target={isPainting ? [0, 1.6, 0] : [0, 1.0, 0]}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                maxPolarAngle={Math.PI / 1.95}
            />
        </Canvas>
    )
}
