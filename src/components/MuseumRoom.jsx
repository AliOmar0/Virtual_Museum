import React, { useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'

/**
 * A reusable interior gallery room. Configurable size for different scene modes.
 * Marble reflective floor, plaster walls, dark ceiling.
 */
export function MuseumRoom({ width = 30, height = 8, depth = 60, hasReflectiveFloor = true }) {
    const wallColor = '#1a1815'
    const ceilingColor = '#0a0908'

    return (
        <group>
            {/* Floor */}
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[width, depth]} />
                {hasReflectiveFloor ? (
                    <MeshReflectorMaterial
                        blur={[200, 80]}
                        resolution={512}
                        mixBlur={1}
                        mixStrength={25}
                        roughness={0.9}
                        depthScale={1}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.4}
                        color="#0e0d0c"
                        metalness={0.3}
                        mirror={0.3}
                    />
                ) : (
                    <meshStandardMaterial color="#0e0d0c" roughness={0.85} metalness={0.2} />
                )}
            </mesh>

            {/* Ceiling */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color={ceilingColor} roughness={1} side={THREE.DoubleSide} />
            </mesh>

            {/* Back wall */}
            <mesh receiveShadow position={[0, height / 2, -depth / 2]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>

            {/* Front wall (behind camera in walkable mode) */}
            <mesh receiveShadow position={[0, height / 2, depth / 2]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>

            {/* Left wall */}
            <mesh receiveShadow position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>

            {/* Right wall */}
            <mesh receiveShadow position={[width / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <meshStandardMaterial color={wallColor} roughness={0.95} />
            </mesh>

            {/* Subtle baseboard along long walls */}
            <mesh position={[-width / 2 + 0.05, 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, 0.2]} />
                <meshStandardMaterial color="#2a2622" roughness={0.5} metalness={0.3} />
            </mesh>
            <mesh position={[width / 2 - 0.05, 0.1, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[depth, 0.2]} />
                <meshStandardMaterial color="#2a2622" roughness={0.5} metalness={0.3} />
            </mesh>
        </group>
    )
}

/**
 * A marble pedestal for statues. Positioned with its base at y=0.
 */
export function Pedestal({ height = 1.1, width = 1.3, depth = 1.3 }) {
    return (
        <group>
            {/* Base flare */}
            <mesh receiveShadow castShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[width + 0.15, 0.1, depth + 0.15]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.35} metalness={0.1} />
            </mesh>
            {/* Column */}
            <mesh receiveShadow castShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height - 0.2, depth]} />
                <meshStandardMaterial color="#e2dccf" roughness={0.4} metalness={0.05} />
            </mesh>
            {/* Top cap */}
            <mesh receiveShadow castShadow position={[0, height - 0.05, 0]}>
                <boxGeometry args={[width + 0.15, 0.1, depth + 0.15]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.35} metalness={0.1} />
            </mesh>
        </group>
    )
}

/**
 * A targeted museum spotlight pointed at a specific position.
 */
export function ExhibitSpotlight({ from = [0, 6, 2], target = [0, 1.5, 0], intensity = 18, color = '#fff7e6', castShadow = false }) {
    const targetObj = useMemo(() => {
        const o = new THREE.Object3D()
        o.position.set(...target)
        return o
    }, [target[0], target[1], target[2]])

    return (
        <>
            <primitive object={targetObj} />
            <spotLight
                position={from}
                intensity={intensity}
                angle={0.55}
                penumbra={0.6}
                distance={20}
                decay={1.5}
                castShadow={castShadow}
                shadow-mapSize={[512, 512]}
                shadow-bias={-0.0005}
                color={color}
                target={targetObj}
            />
        </>
    )
}
