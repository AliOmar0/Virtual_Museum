import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { MuseumRoom } from '../components/MuseumRoom'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'
import { Bench, Column, PendantLamp, WallMolding, Plant } from '../components/Decor'

const ROOM_WIDTH = 16
const ROOM_HEIGHT = 8
const SPACING = 7
const PAINTING_Y = 3.2 // wall mount height (center of painting)

function computeLayout(models) {
    const placements = []
    let paintingIdx = 0
    let statueIdx = 0

    models.forEach((m) => {
        if (m.type === 'painting') {
            const onLeft = paintingIdx % 2 === 0
            const z = -((Math.floor(paintingIdx / 2)) * SPACING + 4)
            const x = onLeft ? -ROOM_WIDTH / 2 + 0.15 : ROOM_WIDTH / 2 - 0.15
            // Left wall: face +X (into the room) → rotate -90° around Y
            // Right wall: face -X (into the room) → rotate +90° around Y
            const rotY = onLeft ? -Math.PI / 2 : Math.PI / 2
            placements.push({ model: m, position: [x, PAINTING_Y, z], rotationY: rotY })
            paintingIdx++
        } else {
            const z = -(statueIdx * SPACING + 6)
            placements.push({ model: m, position: [0, 0, z], rotationY: 0 })
            statueIdx++
        }
    })
    return placements
}

function CameraDriver({ targetPos, lookAt, controlsRef }) {
    const { camera } = useThree()
    useFrame(() => {
        camera.position.x += (targetPos[0] - camera.position.x) * 0.06
        camera.position.y += (targetPos[1] - camera.position.y) * 0.06
        camera.position.z += (targetPos[2] - camera.position.z) * 0.06
        if (controlsRef.current) {
            const t = controlsRef.current.target
            t.x += (lookAt[0] - t.x) * 0.06
            t.y += (lookAt[1] - t.y) * 0.06
            t.z += (lookAt[2] - t.z) * 0.06
            controlsRef.current.update()
        }
    })
    return null
}

export default function WalkableScene({ models, currentIndex }) {
    const placements = useMemo(() => computeLayout(models), [models])
    const controlsRef = useRef()

    const roomDepth = useMemo(() => {
        const maxBack = placements.reduce((acc, p) => Math.min(acc, p.position[2]), 0)
        return Math.max(40, Math.abs(maxBack) * 2 + 16)
    }, [placements])

    // Decorative elements derived from room depth
    const decor = useMemo(() => {
        const lamps = []
        const benches = []
        const columns = []
        const plants = []

        // Pendant lamps every 6m
        for (let z = -2; z > -roomDepth / 2 + 2; z -= 6) {
            lamps.push([0, ROOM_HEIGHT - 0.05, z])
        }
        // Benches between statue spots, off-center
        for (let i = 0; i < Math.floor(roomDepth / 14); i++) {
            const z = -(i * 14 + 9.5)
            if (z < -roomDepth / 2 + 3) break
            benches.push({ position: [3.5, 0, z], rotY: -Math.PI / 2 })
            benches.push({ position: [-3.5, 0, z], rotY: Math.PI / 2 })
        }
        // Decorative columns along walls
        for (let z = -3; z > -roomDepth / 2 + 2; z -= SPACING) {
            columns.push([-ROOM_WIDTH / 2 + 0.6, 0, z + SPACING / 2])
            columns.push([ROOM_WIDTH / 2 - 0.6, 0, z + SPACING / 2])
        }
        // Plants near columns, intermittently
        for (let z = -6; z > -roomDepth / 2 + 2; z -= SPACING * 2) {
            plants.push([-ROOM_WIDTH / 2 + 1.4, 0, z])
            plants.push([ROOM_WIDTH / 2 - 1.4, 0, z])
        }
        return { lamps, benches, columns, plants }
    }, [roomDepth])

    const current = placements[currentIndex] || placements[0]
    const cam = useMemo(() => {
        if (!current) return { pos: [0, 1.7, 5], look: [0, 1.7, 0] }
        const [x, y, z] = current.position
        if (current.model.type === 'painting') {
            const dx = Math.sin(current.rotationY) * 5
            const dz = Math.cos(current.rotationY) * 5
            return { pos: [x - dx, 2.4, z - dz], look: [x, y, z] }
        }
        return { pos: [x, 1.7, z + 5], look: [x, 1.4, z] }
    }, [current])

    return (
        <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
            camera={{ position: [0, 1.7, 5], fov: 55 }}
        >
            <color attach="background" args={['#050403']} />
            <fog attach="fog" args={['#050403', 12, 55]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="apartment" environmentIntensity={0.3} />

                <ambientLight intensity={0.3} />
                <hemisphereLight args={['#fff1d6', '#0a0908', 0.25]} />

                <directionalLight
                    position={[6, 10, 4]}
                    intensity={0.65}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-12}
                    shadow-camera-right={12}
                    shadow-camera-top={12}
                    shadow-camera-bottom={-12}
                    shadow-bias={-0.0005}
                />

                <MuseumRoom
                    width={ROOM_WIDTH}
                    height={ROOM_HEIGHT}
                    depth={roomDepth}
                    hasReflectiveFloor={false}
                />

                {/* Wall molding strips along both side walls */}
                <WallMolding length={roomDepth} position={[-ROOM_WIDTH / 2 + 0.06, 4.0, 0]} rotationY={Math.PI / 2} />
                <WallMolding length={roomDepth} position={[ROOM_WIDTH / 2 - 0.06, 4.0, 0]} rotationY={-Math.PI / 2} />
                <WallMolding length={roomDepth} position={[-ROOM_WIDTH / 2 + 0.06, 1.0, 0]} rotationY={Math.PI / 2} />
                <WallMolding length={roomDepth} position={[ROOM_WIDTH / 2 - 0.06, 1.0, 0]} rotationY={-Math.PI / 2} />

                {/* Pendant ceiling lamps down the centerline */}
                {decor.lamps.map((p, i) => (
                    <PendantLamp key={`lamp-${i}`} position={p} cordLength={1.2} />
                ))}

                {/* Decorative columns */}
                {decor.columns.map((p, i) => (
                    <Column key={`col-${i}`} position={p} height={ROOM_HEIGHT - 0.1} radius={0.28} />
                ))}

                {/* Benches */}
                {decor.benches.map((b, i) => (
                    <Bench key={`bench-${i}`} position={b.position} rotationY={b.rotY} />
                ))}

                {/* Plants */}
                {decor.plants.map((p, i) => (
                    <Plant key={`plant-${i}`} position={p} scale={1.1} />
                ))}

                {placements.map(({ model, position, rotationY }, i) => (
                    <Exhibit
                        key={model.id}
                        modelData={model}
                        position={position}
                        rotationY={rotationY}
                        withSpotlight={i === currentIndex}
                        withPedestal
                        targetSize={model.type === 'painting' ? 3.0 : undefined}
                    />
                ))}
            </Suspense>

            <CameraDriver targetPos={cam.pos} lookAt={cam.look} controlsRef={controlsRef} />

            <OrbitControls
                ref={controlsRef}
                enablePan={false}
                minDistance={2}
                maxDistance={20}
                maxPolarAngle={Math.PI / 1.95}
                target={cam.look}
                makeDefault
                enableDamping
                dampingFactor={0.1}
            />
        </Canvas>
    )
}
