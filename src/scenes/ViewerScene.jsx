import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
    OrbitControls,
    Environment,
    ContactShadows,
    Float,
    Preload,
} from '@react-three/drei'
import * as THREE from 'three'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'

function CameraRig() {
    const { camera } = useThree()
    useEffect(() => {
        camera.position.set(0, 1.0, 7)
        camera.lookAt(0, 0.5, 0)
    }, [camera])
    return null
}

export default function ViewerScene({ modelData }) {
    return (
        <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            camera={{ position: [0, 1, 7], fov: 35 }}
        >
            <color attach="background" args={['#070605']} />
            <fog attach="fog" args={['#070605', 12, 35]} />

            <CameraRig />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={0.35} />

                {/* Soft fill */}
                <ambientLight intensity={0.25} />
                <hemisphereLight args={['#fff1d6', '#1a1410', 0.3]} />

                {/* Key + rim */}
                <directionalLight
                    position={[6, 8, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize={[2048, 2048]}
                    shadow-bias={-0.0005}
                />
                <pointLight position={[-5, 3, -3]} intensity={0.6} color="#5577aa" />

                {modelData.type === 'painting' ? (
                    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.05}>
                        <Exhibit
                            modelData={modelData}
                            position={[0, 0.6, 0]}
                            withSpotlight
                            withPedestal={false}
                            castShadowSpot
                        />
                    </Float>
                ) : (
                    <Exhibit
                        modelData={modelData}
                        position={[0, -1.0, 0]}
                        autoRotate
                        withSpotlight
                        withPedestal
                        castShadowSpot
                    />
                )}

                <ContactShadows
                    scale={20}
                    blur={2.5}
                    opacity={0.45}
                    far={8}
                    position={[0, -1.05, 0]}
                />
            </Suspense>

            <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={3}
                maxDistance={14}
                target={[0, 0.6, 0]}
                makeDefault
                enableDamping
                dampingFactor={0.08}
            />

            <Preload all />
        </Canvas>
    )
}
