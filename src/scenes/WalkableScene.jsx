import React, { Suspense, useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { MuseumRoom } from '../components/MuseumRoom'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'
import {
    Bench, Column, PendantLamp, WallMolding, Plant,
    WallPanel, Plaque, RoomDivider, RoomBanner,
} from '../components/Decor'
import {
    computeLayout, categoryMeta,
    ROOM_WIDTH, ROOM_HEIGHT, SPACING, PAINTING_Y,
} from './walkableLayout'

const PAINTING_TARGET = 2.6
const lerp = (a, b, t) => a + (b - a) * t

function CameraDriver({ targetPos, lookAt, controlsRef, onPose }) {
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
        // Report camera pose for the minimap (yaw derived from look direction)
        if (onPose) {
            const dx = controlsRef.current ? controlsRef.current.target.x - camera.position.x : 0
            const dz = controlsRef.current ? controlsRef.current.target.z - camera.position.z : -1
            const yaw = Math.atan2(dx, -dz)
            onPose(camera.position.x, camera.position.z, yaw)
        }
    })
    return null
}

export default function WalkableScene({
    models,
    currentIndex,
    lightingValue = 0,
    onCameraMove,
}) {
    const { placements, dividers, endZ } = useMemo(() => computeLayout(models), [models])
    const controlsRef = useRef()

    const roomDepth = useMemo(() => Math.max(40, Math.abs(endZ) + 12), [endZ])

    const decor = useMemo(() => {
        const lamps = []
        const benches = []
        const columns = []
        const plants = []
        for (let z = -2; z > -roomDepth + 4; z -= 7) {
            lamps.push([0, ROOM_HEIGHT - 0.05, z])
        }
        for (let z = -10; z > -roomDepth + 4; z -= 18) {
            benches.push({ position: [3.8, 0, z], rotY: -Math.PI / 2 })
            benches.push({ position: [-3.8, 0, z], rotY: Math.PI / 2 })
        }
        for (let z = -3; z > -roomDepth + 4; z -= SPACING) {
            columns.push([-ROOM_WIDTH / 2 + 0.6, 0, z + SPACING / 2])
            columns.push([ROOM_WIDTH / 2 - 0.6, 0, z + SPACING / 2])
        }
        for (let z = -6; z > -roomDepth + 4; z -= SPACING * 2) {
            plants.push([-ROOM_WIDTH / 2 + 1.5, 0, z])
            plants.push([ROOM_WIDTH / 2 - 1.5, 0, z])
        }
        return { lamps, benches, columns, plants }
    }, [roomDepth])

    const current = placements[currentIndex] || placements[0]
    const cam = useMemo(() => {
        if (!current) return { pos: [0, 1.7, 5], look: [0, 1.7, 0] }
        const [x, y, z] = current.position
        if (current.model.type === 'painting') {
            const fx = Math.sin(current.rotationY)
            const fz = Math.cos(current.rotationY)
            return { pos: [x + fx * 5.5, 2.4, z + fz * 5.5], look: [x, y, z] }
        }
        return { pos: [x, 1.7, z + 5.5], look: [x, 1.4, z] }
    }, [current])

    // Lighting interpolation
    const dirIntensity = lerp(0.65, 0.25, lightingValue)
    const ambIntensity = lerp(0.3, 0.08, lightingValue)
    const hemiIntensity = lerp(0.25, 0.06, lightingValue)
    const envIntensity = lerp(0.3, 0.1, lightingValue)
    const fogNear = lerp(12, 8, lightingValue)
    const fogFar = lerp(55, 38, lightingValue)
    const exposure = lerp(1.0, 0.85, lightingValue)
    const lampIntensity = lerp(0.6, 0.95, lightingValue)

    return (
        <Canvas
            shadows
            dpr={[1, 1.5]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure }}
            camera={{ position: [0, 1.7, 5], fov: 60 }}
        >
            <color attach="background" args={['#050403']} />
            <fog attach="fog" args={['#050403', fogNear, fogFar]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="apartment" environmentIntensity={envIntensity} />

                <ambientLight intensity={ambIntensity} />
                <hemisphereLight args={['#fff1d6', '#0a0908', hemiIntensity]} />

                <directionalLight
                    position={[6, 10, 4]}
                    intensity={dirIntensity}
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

                {/* Wall molding strips */}
                <WallMolding length={roomDepth} position={[-ROOM_WIDTH / 2 + 0.06, 4.2, 0]} rotationY={Math.PI / 2} />
                <WallMolding length={roomDepth} position={[ROOM_WIDTH / 2 - 0.06, 4.2, 0]} rotationY={-Math.PI / 2} />
                <WallMolding length={roomDepth} position={[-ROOM_WIDTH / 2 + 0.06, 1.0, 0]} rotationY={Math.PI / 2} />
                <WallMolding length={roomDepth} position={[ROOM_WIDTH / 2 - 0.06, 1.0, 0]} rotationY={-Math.PI / 2} />

                {/* Pendant lamps */}
                {decor.lamps.map((p, i) => (
                    <PendantLamp key={`lamp-${i}`} position={p} cordLength={1.2} intensity={lampIntensity} />
                ))}

                {/* Columns */}
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

                {/* Room dividers / banners */}
                {dividers.map((d, i) => (
                    <React.Fragment key={`div-${i}`}>
                        {!d.first && <RoomDivider z={d.z} width={ROOM_WIDTH} color={d.accent} />}
                        <RoomBanner z={d.z} label={d.label} accent={d.accent} height={ROOM_HEIGHT - 0.4} />
                    </React.Fragment>
                ))}

                {/* Exhibits */}
                {placements.map(({ model, position, rotationY, category }, i) => {
                    const accent = categoryMeta(category).accent
                    const isPainting = model.type === 'painting'
                    return (
                        <group key={model.id}>
                            {/* Wall panel behind paintings — gives them their own "spot" */}
                            {isPainting && (
                                <WallPanel
                                    position={[position[0] + Math.sin(rotationY) * 0.02, PAINTING_Y, position[2]]}
                                    rotationY={rotationY}
                                    width={SPACING - 1.5}
                                    height={4.4}
                                />
                            )}
                            <Exhibit
                                modelData={model}
                                position={position}
                                rotationY={rotationY}
                                withSpotlight={i === currentIndex}
                                withPedestal={!isPainting}
                                targetSize={isPainting ? PAINTING_TARGET : undefined}
                            />
                            {/* Plaque */}
                            {isPainting ? (
                                <Plaque
                                    title={model.title}
                                    artist={model.artist}
                                    year={model.year}
                                    medium={model.medium}
                                    mode="wall"
                                    accent={accent}
                                    position={[
                                        position[0] - Math.sin(rotationY) * 0.06,
                                        PAINTING_Y - 1.7,
                                        position[2],
                                    ]}
                                    rotationY={rotationY}
                                />
                            ) : (
                                <Plaque
                                    title={model.title}
                                    artist={model.artist}
                                    year={model.year}
                                    medium={model.medium}
                                    mode="pedestal"
                                    accent={accent}
                                    position={[position[0], 0.55, position[2] + 0.66]}
                                />
                            )}
                        </group>
                    )
                })}
            </Suspense>

            <CameraDriver
                targetPos={cam.pos}
                lookAt={cam.look}
                controlsRef={controlsRef}
                onPose={onCameraMove}
            />
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

