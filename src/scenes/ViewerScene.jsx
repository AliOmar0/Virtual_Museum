import React, { Suspense, useEffect } from 'react'
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

export default function ViewerScene({ modelData, dramatic = false }) {
    const isPainting = modelData.type === 'painting'
    const bg = dramatic ? '#020202' : '#070605'
    const exposure = dramatic ? 0.85 : 1.0

    return (
        <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure }}
            camera={{ position: [0, 1.3, 4.5], fov: 40 }}
        >
            <color attach="background" args={[bg]} />
            <fog attach="fog" args={[bg, dramatic ? 8 : 14, dramatic ? 26 : 40]} />

            <CameraRig isPainting={isPainting} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={dramatic ? 0.12 : 0.4} />

                <ambientLight intensity={dramatic ? 0.06 : 0.3} />
                <hemisphereLight args={['#fff1d6', '#1a1410', dramatic ? 0.08 : 0.35]} />

                <directionalLight
                    position={[6, 8, 5]}
                    intensity={dramatic ? 0.4 : 1.0}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-bias={-0.0005}
                />
                <pointLight position={[-5, 3, -3]} intensity={dramatic ? 0.2 : 0.5} color="#5577aa" />

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
