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
            camera.position.set(0, 1.4, 5)
            camera.lookAt(0, 1.4, 0)
        } else {
            camera.position.set(0, 1.6, 5)
            camera.lookAt(0, 1.4, 0)
        }
    }, [camera, isPainting])
    return null
}

export default function ViewerScene({ modelData }) {
    const isPainting = modelData.type === 'painting'

    return (
        <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            camera={{ position: [0, 1.6, 5], fov: 40 }}
        >
            <color attach="background" args={['#070605']} />
            <fog attach="fog" args={['#070605', 14, 40]} />

            <CameraRig isPainting={isPainting} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={0.4} />

                <ambientLight intensity={0.3} />
                <hemisphereLight args={['#fff1d6', '#1a1410', 0.35]} />

                <directionalLight
                    position={[6, 8, 5]}
                    intensity={1.0}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-bias={-0.0005}
                />
                <pointLight position={[-5, 3, -3]} intensity={0.5} color="#5577aa" />

                {isPainting ? (
                    <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.05}>
                        <Exhibit
                            modelData={modelData}
                            position={[0, 1.6, 0]}
                            withSpotlight
                            withPedestal={false}
                            castShadowSpot
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
                target={isPainting ? [0, 1.4, 0] : [0, 1.4, 0]}
                makeDefault
                enableDamping
                dampingFactor={0.08}
                maxPolarAngle={Math.PI / 1.95}
            />
        </Canvas>
    )
}
