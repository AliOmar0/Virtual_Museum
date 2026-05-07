import React, { Suspense, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Preload } from '@react-three/drei'
import * as THREE from 'three'
import { MuseumRoom } from '../components/MuseumRoom'
import { Exhibit } from '../components/ExhibitDisplay'
import { ModelLoadingFallback } from '../components/ModelLoader'

const ROOM_WIDTH = 16
const ROOM_DEPTH = 60
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
            const x = onLeft ? -ROOM_WIDTH / 2 + 0.05 : ROOM_WIDTH / 2 - 0.05
            const rotY = onLeft ? Math.PI / 2 : -Math.PI / 2
            placements.push({ model: m, position: [x, 2.4, z], rotationY: rotY })
            paintingIdx++
        } else {
            const z = -(statueIdx * SPACING + 6)
            placements.push({ model: m, position: [0, 0, z], rotationY: 0 })
            statueIdx++
        }
    })
    return placements
}

function CameraTarget({ targetPos, lookAt }) {
    const { camera } = useThree()
    const tmp = useRef(new THREE.Vector3())
    const lookTmp = useRef(new THREE.Vector3())
    const lookCurrent = useRef(new THREE.Vector3(...lookAt))

    useFrame(() => {
        tmp.current.set(...targetPos)
        camera.position.lerp(tmp.current, 0.06)
        lookTmp.current.set(...lookAt)
        lookCurrent.current.lerp(lookTmp.current, 0.06)
    })

    return null
}

function CameraDriver({ targetPos, lookAt, controlsRef }) {
    const { camera } = useThree()
    useFrame(() => {
        const tx = targetPos[0]
        const ty = targetPos[1]
        const tz = targetPos[2]
        camera.position.x += (tx - camera.position.x) * 0.06
        camera.position.y += (ty - camera.position.y) * 0.06
        camera.position.z += (tz - camera.position.z) * 0.06
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

    const current = placements[currentIndex] || placements[0]
    const cam = useMemo(() => {
        if (!current) return { pos: [0, 1.7, 5], look: [0, 1.7, 0] }
        const [x, y, z] = current.position
        if (current.model.type === 'painting') {
            const dx = Math.sin(current.rotationY) * 4
            const dz = Math.cos(current.rotationY) * 4
            return { pos: [x - dx, 2.0, z - dz], look: [x, y, z] }
        } else {
            return { pos: [x, 1.7, z + 5], look: [x, y + 1.6, z] }
        }
    }, [current])

    return (
        <Canvas
            shadows
            dpr={[1, 1.75]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
            camera={{ position: cam.pos, fov: 55 }}
        >
            <color attach="background" args={['#050403']} />
            <fog attach="fog" args={['#050403', 8, 50]} />

            <Suspense fallback={<ModelLoadingFallback />}>
                <Environment preset="apartment" environmentIntensity={0.18} />

                <ambientLight intensity={0.18} />
                <hemisphereLight args={['#fff1d6', '#0a0908', 0.15]} />

                <MuseumRoom
                    width={ROOM_WIDTH}
                    height={ROOM_HEIGHT}
                    depth={ROOM_DEPTH}
                    hasReflectiveFloor
                />

                {placements.map(({ model, position, rotationY }) => (
                    <Exhibit
                        key={model.id}
                        modelData={model}
                        position={position}
                        rotationY={rotationY}
                        withSpotlight
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
                maxPolarAngle={Math.PI / 1.9}
                target={cam.look}
                makeDefault
                enableDamping
                dampingFactor={0.1}
            />
            <Preload all />
        </Canvas>
    )
}
