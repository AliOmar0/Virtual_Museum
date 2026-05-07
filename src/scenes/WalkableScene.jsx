import React, { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { MuseumRoom } from '../components/MuseumRoom'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'

const ROOM_WIDTH = 16
const ROOM_HEIGHT = 8
const SPACING = 7

function computeLayout(models) {
    // Alternate paintings on left/right walls; statues down the centerline
    const placements = []
    let paintingIdx = 0
    let statueIdx = 0

    models.forEach((m) => {
        if (m.type === 'painting') {
            const onLeft = paintingIdx % 2 === 0
            const z = -((Math.floor(paintingIdx / 2)) * SPACING + 4)
            const x = onLeft ? -ROOM_WIDTH / 2 + 0.1 : ROOM_WIDTH / 2 - 0.1
            const rotY = onLeft ? Math.PI / 2 : -Math.PI / 2
            placements.push({ model: m, position: [x, 2.6, z], rotationY: rotY })
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

    // Room must extend far enough to hold every exhibit + entry space
    const roomDepth = useMemo(() => {
        const maxBack = placements.reduce((acc, p) => Math.min(acc, p.position[2]), 0)
        return Math.max(40, Math.abs(maxBack) * 2 + 16)
    }, [placements])

    const current = placements[currentIndex] || placements[0]
    const cam = useMemo(() => {
        if (!current) return { pos: [0, 1.7, 5], look: [0, 1.7, 0] }
        const [x, y, z] = current.position
        if (current.model.type === 'painting') {
            const dx = Math.sin(current.rotationY) * 4.5
            const dz = Math.cos(current.rotationY) * 4.5
            return { pos: [x - dx, 2.2, z - dz], look: [x, y, z] }
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
            <fog attach="fog" args={['#050403', 10, 55]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="apartment" environmentIntensity={0.35} />

                <ambientLight intensity={0.35} />
                <hemisphereLight args={['#fff1d6', '#0a0908', 0.3]} />

                {/* One shadow-casting key light over the whole hall */}
                <directionalLight
                    position={[6, 10, 4]}
                    intensity={0.7}
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

                {placements.map(({ model, position, rotationY }, i) => (
                    <Exhibit
                        key={model.id}
                        modelData={model}
                        position={position}
                        rotationY={rotationY}
                        withSpotlight={i === currentIndex}
                        withPedestal
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
