import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'

const COLS = 4
const COL_SPACING = 5
const ROW_SPACING = 5.5

function gridLayout(models) {
    return models.map((m, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const x = (col - (COLS - 1) / 2) * COL_SPACING
        const z = -row * ROW_SPACING
        return { model: m, position: [x, 0, z] }
    })
}

function CameraDriver({ targetPos, lookAt, controlsRef }) {
    const { camera } = useThree()
    useFrame(() => {
        camera.position.x += (targetPos[0] - camera.position.x) * 0.08
        camera.position.y += (targetPos[1] - camera.position.y) * 0.08
        camera.position.z += (targetPos[2] - camera.position.z) * 0.08
        if (controlsRef.current) {
            const t = controlsRef.current.target
            t.x += (lookAt[0] - t.x) * 0.08
            t.y += (lookAt[1] - t.y) * 0.08
            t.z += (lookAt[2] - t.z) * 0.08
            controlsRef.current.update()
        }
    })
    return null
}

export default function GridScene({ models, currentIndex, onSelect }) {
    const placements = useMemo(() => gridLayout(models), [models])
    const controlsRef = useRef()
    const current = placements[currentIndex] || placements[0]

    const cam = useMemo(() => {
        const [x, , z] = current.position
        return { pos: [x, 1.8, z + 4.5], look: [x, 1.0, z] }
    }, [current])

    const rows = Math.ceil(models.length / COLS)
    const floorCenterZ = -((rows - 1) * ROW_SPACING) / 2
    const floorWidth = COL_SPACING * COLS + 8
    const floorDepth = ROW_SPACING * rows + 10

    return (
        <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            camera={{ position: [0, 8, 14], fov: 45 }}
        >
            <color attach="background" args={['#0a0908']} />
            <fog attach="fog" args={['#0a0908', 16, 60]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={0.45} />

                <ambientLight intensity={0.4} />
                <hemisphereLight args={['#fff1d6', '#0a0908', 0.35]} />

                <directionalLight
                    position={[10, 14, 8]}
                    intensity={0.9}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-15}
                    shadow-camera-right={15}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-15}
                    shadow-bias={-0.0005}
                />

                {placements.map(({ model, position }, i) => (
                    <group
                        key={model.id}
                        onClick={(e) => { e.stopPropagation(); onSelect && onSelect(i) }}
                    >
                        <Exhibit
                            modelData={model}
                            position={position}
                            withSpotlight={i === currentIndex}
                            withPedestal
                        />
                        {i === currentIndex && (
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]}>
                                <ringGeometry args={[1.5, 1.65, 64]} />
                                <meshBasicMaterial color="#d4af37" transparent opacity={0.8} />
                            </mesh>
                        )}
                    </group>
                ))}

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, floorCenterZ]} receiveShadow>
                    <planeGeometry args={[floorWidth, floorDepth]} />
                    <meshStandardMaterial color="#161412" roughness={0.9} metalness={0.1} />
                </mesh>

                <ContactShadows
                    scale={Math.max(floorWidth, floorDepth)}
                    blur={2.5}
                    opacity={0.45}
                    far={6}
                    position={[0, 0.01, floorCenterZ]}
                />
            </Suspense>

            <CameraDriver targetPos={cam.pos} lookAt={cam.look} controlsRef={controlsRef} />

            <OrbitControls
                ref={controlsRef}
                enablePan
                minDistance={3}
                maxDistance={40}
                maxPolarAngle={Math.PI / 2.05}
                target={cam.look}
                makeDefault
                enableDamping
                dampingFactor={0.1}
            />
        </Canvas>
    )
}
