import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { ModelDisplay } from '../ModelLoader'

/**
 * Self-contained 3D preview used inside the Add Model dialog. Renders the
 * model with the user's live tilt/scale/yOffset/type so they can see what it
 * will look like in the gallery before committing.
 */
export default function ModelPreview({ modelData }) {
    const isPainting = modelData?.type === 'painting'
    return (
        <div className="model-preview-stage">
            <Canvas
                shadows
                dpr={[1, 1.5]}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
                camera={{ position: isPainting ? [0, 0.4, 4] : [2.4, 1.6, 3.4], fov: 45 }}
            >
                <color attach="background" args={['#13110f']} />
                <Suspense fallback={null}>
                    <Environment preset="apartment" environmentIntensity={0.6} />
                    <ambientLight intensity={0.45} />
                    <hemisphereLight args={['#fff1d6', '#0a0908', 0.25]} />
                    <directionalLight
                        position={[3.5, 5, 3.5]}
                        intensity={0.9}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                        shadow-bias={-0.0005}
                    />
                    <spotLight
                        position={[0, 4, 3]}
                        angle={0.6}
                        penumbra={0.6}
                        intensity={6}
                        target-position={[0, isPainting ? 0 : 0.8, 0]}
                    />

                    {modelData && <ModelDisplay modelData={modelData} alignBottom={!isPainting} />}

                    {!isPainting && (
                        <ContactShadows
                            position={[0, 0, 0]}
                            opacity={0.55}
                            scale={6}
                            blur={2.2}
                            far={4}
                        />
                    )}
                </Suspense>
                <OrbitControls
                    enablePan={false}
                    minDistance={1.5}
                    maxDistance={9}
                    target={[0, isPainting ? 0 : 1.0, 0]}
                    enableDamping
                    dampingFactor={0.1}
                />
            </Canvas>
            <div className="preview-help">Drag to orbit · Scroll to zoom</div>
        </div>
    )
}
