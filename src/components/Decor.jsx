import React, { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Simple gallery bench: dark wood plank on stone legs.
 */
export function Bench({ position = [0, 0, 0], rotationY = 0, length = 2.4 }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Seat */}
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[length, 0.1, 0.55]} />
                <meshStandardMaterial color="#2a1d12" roughness={0.55} metalness={0.05} />
            </mesh>
            {/* Legs */}
            <mesh castShadow receiveShadow position={[-length / 2 + 0.25, 0.225, 0]}>
                <boxGeometry args={[0.18, 0.45, 0.5]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
            <mesh castShadow receiveShadow position={[length / 2 - 0.25, 0.225, 0]}>
                <boxGeometry args={[0.18, 0.45, 0.5]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
        </group>
    )
}

/**
 * Decorative marble column.
 */
export function Column({ position = [0, 0, 0], height = 6, radius = 0.35 }) {
    return (
        <group position={position}>
            {/* Base */}
            <mesh receiveShadow castShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[radius * 2.6, 0.2, radius * 2.6]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Shaft */}
            <mesh receiveShadow castShadow position={[0, height / 2, 0]}>
                <cylinderGeometry args={[radius, radius * 1.05, height, 24]} />
                <meshStandardMaterial color="#e2dccf" roughness={0.55} metalness={0.05} />
            </mesh>
            {/* Capital */}
            <mesh receiveShadow castShadow position={[0, height - 0.15, 0]}>
                <boxGeometry args={[radius * 2.8, 0.3, radius * 2.8]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
        </group>
    )
}

/**
 * Pendant ceiling lamp — adds visual interest plus a soft warm point light.
 */
export function PendantLamp({ position = [0, 7, 0], cordLength = 1.0 }) {
    return (
        <group position={position}>
            {/* Cord */}
            <mesh position={[0, -cordLength / 2, 0]}>
                <cylinderGeometry args={[0.015, 0.015, cordLength, 6]} />
                <meshStandardMaterial color="#1a1410" />
            </mesh>
            {/* Shade — emissive */}
            <mesh position={[0, -cordLength - 0.1, 0]}>
                <coneGeometry args={[0.22, 0.28, 16, 1, true]} />
                <meshStandardMaterial
                    color="#3a2814"
                    emissive="#ffd089"
                    emissiveIntensity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Bulb glow */}
            <mesh position={[0, -cordLength - 0.18, 0]}>
                <sphereGeometry args={[0.07, 12, 8]} />
                <meshStandardMaterial color="#fff1b0" emissive="#fff1b0" emissiveIntensity={2.5} />
            </mesh>
            <pointLight
                position={[0, -cordLength - 0.18, 0]}
                intensity={0.6}
                distance={6}
                decay={1.5}
                color="#ffd089"
            />
        </group>
    )
}

/**
 * Empty decorative wall frame between exhibits.
 */
export function WallFrame({ position = [0, 0, 0], rotationY = 0, width = 1.2, height = 1.6 }) {
    const t = 0.08
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Back canvas */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[width - t * 2, height - t * 2]} />
                <meshStandardMaterial color="#221b14" roughness={0.85} />
            </mesh>
            {/* Frame */}
            <mesh castShadow position={[0, height / 2 - t / 2, 0.02]}>
                <boxGeometry args={[width, t, 0.06]} />
                <meshStandardMaterial color="#a17a32" roughness={0.4} metalness={0.55} />
            </mesh>
            <mesh castShadow position={[0, -height / 2 + t / 2, 0.02]}>
                <boxGeometry args={[width, t, 0.06]} />
                <meshStandardMaterial color="#a17a32" roughness={0.4} metalness={0.55} />
            </mesh>
            <mesh castShadow position={[-width / 2 + t / 2, 0, 0.02]}>
                <boxGeometry args={[t, height, 0.06]} />
                <meshStandardMaterial color="#a17a32" roughness={0.4} metalness={0.55} />
            </mesh>
            <mesh castShadow position={[width / 2 - t / 2, 0, 0.02]}>
                <boxGeometry args={[t, height, 0.06]} />
                <meshStandardMaterial color="#a17a32" roughness={0.4} metalness={0.55} />
            </mesh>
        </group>
    )
}

/**
 * Subtle wall molding strip (horizontal trim line).
 */
export function WallMolding({ length = 60, position = [0, 3, 0], rotationY = 0 }) {
    return (
        <mesh position={position} rotation={[0, rotationY, 0]} castShadow>
            <boxGeometry args={[length, 0.08, 0.04]} />
            <meshStandardMaterial color="#a17a32" roughness={0.5} metalness={0.4} />
        </mesh>
    )
}

/**
 * Low-poly potted plant for visual variety.
 */
export function Plant({ position = [0, 0, 0], scale = 1 }) {
    return (
        <group position={position} scale={scale}>
            {/* Pot */}
            <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.22, 0.18, 0.36, 16]} />
                <meshStandardMaterial color="#2b1d12" roughness={0.7} metalness={0.05} />
            </mesh>
            {/* Foliage clusters */}
            <mesh castShadow position={[0, 0.55, 0]}>
                <icosahedronGeometry args={[0.32, 0]} />
                <meshStandardMaterial color="#1f3a1a" roughness={0.85} flatShading />
            </mesh>
            <mesh castShadow position={[0.18, 0.65, 0.12]}>
                <icosahedronGeometry args={[0.22, 0]} />
                <meshStandardMaterial color="#264a1f" roughness={0.85} flatShading />
            </mesh>
            <mesh castShadow position={[-0.16, 0.7, -0.08]}>
                <icosahedronGeometry args={[0.20, 0]} />
                <meshStandardMaterial color="#1f3a1a" roughness={0.85} flatShading />
            </mesh>
        </group>
    )
}
