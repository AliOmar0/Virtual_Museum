import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'
import { PendantLamp, Plant, Column } from '../components/Decor'

const COLS = 4
const COL_SPACING = 5
const ROW_SPACING = 5.5
const PAINTING_DISPLAY_Y = 1.8 // center of painting on its display stand

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

/**
 * Display stand for paintings in grid view — a thin vertical back panel with
 * a base, so paintings hang at eye level instead of sitting on the floor.
 */
function PaintingStand({ position = [0, 0, 0], height = 3.4 }) {
    return (
        <group position={position}>
            {/* Base */}
            <mesh receiveShadow castShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[2.0, 0.1, 0.6]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Vertical panel behind the painting */}
            <mesh receiveShadow castShadow position={[0, height / 2, -0.18]}>
                <boxGeometry args={[2.0, height, 0.08]} />
                <meshStandardMaterial color="#1f1a16" roughness={0.85} metalness={0.05} />
            </mesh>
        </group>
    )
}

export default function GridScene({ models, currentIndex, onSelect }) {
    const placements = useMemo(() => gridLayout(models), [models])
    const controlsRef = useRef()
    const current = placements[currentIndex] || placements[0]

    const cam = useMemo(() => {
        const [x, , z] = current.position
        const isPainting = current.model.type === 'painting'
        return isPainting
            ? { pos: [x, 1.9, z + 4.5], look: [x, PAINTING_DISPLAY_Y, z] }
            : { pos: [x, 1.8, z + 4.5], look: [x, 1.0, z] }
    }, [current])

    const rows = Math.ceil(models.length / COLS)
    const floorCenterZ = -((rows - 1) * ROW_SPACING) / 2
    const floorWidth = COL_SPACING * COLS + 8
    const floorDepth = ROW_SPACING * rows + 10

    // Decorative ceiling lamps over each cell
    const lamps = useMemo(() => {
        const out = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = (c - (COLS - 1) / 2) * COL_SPACING
                const z = -r * ROW_SPACING
                out.push([x, 5.5, z])
            }
        }
        return out
    }, [rows])

    return (
        <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            camera={{ position: [0, 8, 14], fov: 45 }}
        >
            <color attach="background" args={['#0a0908']} />
            <fog attach="fog" args={['#0a0908', 18, 65]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="warehouse" environmentIntensity={0.45} />

                <ambientLight intensity={0.4} />
                <hemisphereLight args={['#fff1d6', '#0a0908', 0.35]} />

                <directionalLight
                    position={[10, 14, 8]}
                    intensity={0.85}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-15}
                    shadow-camera-right={15}
                    shadow-camera-top={10}
                    shadow-camera-bottom={-15}
                    shadow-bias={-0.0005}
                />

                {/* Ceiling lamps over each exhibit */}
                {lamps.map((p, i) => (
                    <PendantLamp key={`grid-lamp-${i}`} position={p} cordLength={0.6} />
                ))}

                {/* Corner columns */}
                <Column position={[-(floorWidth / 2 - 0.6), 0, 1]} height={6} radius={0.3} />
                <Column position={[(floorWidth / 2 - 0.6), 0, 1]} height={6} radius={0.3} />
                <Column position={[-(floorWidth / 2 - 0.6), 0, floorCenterZ * 2 - 1]} height={6} radius={0.3} />
                <Column position={[(floorWidth / 2 - 0.6), 0, floorCenterZ * 2 - 1]} height={6} radius={0.3} />

                {/* Plants in the corners */}
                <Plant position={[-(floorWidth / 2 - 1.6), 0, 0.2]} scale={1.1} />
                <Plant position={[(floorWidth / 2 - 1.6), 0, 0.2]} scale={1.1} />

                {placements.map(({ model, position }, i) => {
                    const isPainting = model.type === 'painting'
                    const exhibitPos = isPainting
                        ? [position[0], PAINTING_DISPLAY_Y, position[2]]
                        : position
                    return (
                        <group
                            key={model.id}
                            onClick={(e) => { e.stopPropagation(); onSelect && onSelect(i) }}
                        >
                            {isPainting && <PaintingStand position={position} />}
                            <Exhibit
                                modelData={model}
                                position={exhibitPos}
                                withSpotlight={i === currentIndex}
                                withPedestal={!isPainting}
                                targetSize={isPainting ? 2.4 : 1.7}
                            />
                            {i === currentIndex && (
                                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]}>
                                    <ringGeometry args={[1.5, 1.7, 64]} />
                                    <meshBasicMaterial color="#d4af37" transparent opacity={0.85} />
                                </mesh>
                            )}
                        </group>
                    )
                })}

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
