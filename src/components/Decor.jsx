import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'

/**
 * Simple gallery bench: dark wood plank on stone legs.
 */
export function Bench({ position = [0, 0, 0], rotationY = 0, length = 2.4 }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
                <boxGeometry args={[length, 0.1, 0.55]} />
                <meshStandardMaterial color="#2a1d12" roughness={0.55} metalness={0.05} />
            </mesh>
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

export function Column({ position = [0, 0, 0], height = 6, radius = 0.35 }) {
    return (
        <group position={position}>
            <mesh receiveShadow castShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[radius * 2.6, 0.2, radius * 2.6]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
            <mesh receiveShadow castShadow position={[0, height / 2, 0]}>
                <cylinderGeometry args={[radius, radius * 1.05, height, 24]} />
                <meshStandardMaterial color="#e2dccf" roughness={0.55} metalness={0.05} />
            </mesh>
            <mesh receiveShadow castShadow position={[0, height - 0.15, 0]}>
                <boxGeometry args={[radius * 2.8, 0.3, radius * 2.8]} />
                <meshStandardMaterial color="#cfc8bd" roughness={0.5} metalness={0.1} />
            </mesh>
        </group>
    )
}

export function PendantLamp({ position = [0, 7, 0], cordLength = 1.0, intensity = 0.6 }) {
    return (
        <group position={position}>
            <mesh position={[0, -cordLength / 2, 0]}>
                <cylinderGeometry args={[0.015, 0.015, cordLength, 6]} />
                <meshStandardMaterial color="#1a1410" />
            </mesh>
            <mesh position={[0, -cordLength - 0.1, 0]}>
                <coneGeometry args={[0.22, 0.28, 16, 1, true]} />
                <meshStandardMaterial
                    color="#3a2814"
                    emissive="#ffd089"
                    emissiveIntensity={0.6}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, -cordLength - 0.18, 0]}>
                <sphereGeometry args={[0.07, 12, 8]} />
                <meshStandardMaterial color="#fff1b0" emissive="#fff1b0" emissiveIntensity={2.5} />
            </mesh>
            <pointLight
                position={[0, -cordLength - 0.18, 0]}
                intensity={intensity}
                distance={6}
                decay={1.5}
                color="#ffd089"
            />
        </group>
    )
}

export function WallMolding({ length = 60, position = [0, 3, 0], rotationY = 0 }) {
    return (
        <mesh position={position} rotation={[0, rotationY, 0]} castShadow>
            <boxGeometry args={[length, 0.08, 0.04]} />
            <meshStandardMaterial color="#a17a32" roughness={0.5} metalness={0.4} />
        </mesh>
    )
}

export function Plant({ position = [0, 0, 0], scale = 1 }) {
    return (
        <group position={position} scale={scale}>
            <mesh castShadow receiveShadow position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.22, 0.18, 0.36, 16]} />
                <meshStandardMaterial color="#2b1d12" roughness={0.7} metalness={0.05} />
            </mesh>
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

/**
 * Wall panel — a slightly raised rectangular section that visually frames a
 * painting on the wall, so the painting reads as having its own "spot."
 */
export function WallPanel({ position = [0, 0, 0], rotationY = 0, width = 5, height = 5, color = '#221d18' }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <mesh receiveShadow castShadow position={[0, 0, 0.02]}>
                <boxGeometry args={[width, height, 0.05]} />
                <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
            </mesh>
            {/* Inner shadow line */}
            <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[width - 0.15, height - 0.15]} />
                <meshStandardMaterial color="#0c0a08" roughness={1} />
            </mesh>
        </group>
    )
}

/**
 * 3D engraved plaque rendered with troika-three-text. Lives next to an
 * exhibit. Used for both wall-mounted (painting) and floor-mounted (statue)
 * variants.
 *
 * `mode` = 'wall' → small horizontal brass plate to the side of a painting
 * `mode` = 'pedestal' → diagonal plate on the front face of a pedestal
 */
export function Plaque({
    title,
    artist,
    year,
    medium,
    position = [0, 0, 0],
    rotationY = 0,
    mode = 'pedestal',
    accent = '#d4af37',
}) {
    const isWall = mode === 'wall'
    const w = isWall ? 0.95 : 1.05
    const h = isWall ? 0.55 : 0.32
    const fontSize = isWall ? 0.085 : 0.078
    const subSize = isWall ? 0.05 : 0.05

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Brass plate */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[w, h, 0.03]} />
                <meshStandardMaterial color={accent} metalness={0.85} roughness={0.35} />
            </mesh>
            {/* Inset darker face */}
            <mesh position={[0, 0, 0.018]}>
                <planeGeometry args={[w - 0.06, h - 0.06]} />
                <meshStandardMaterial color="#1f1812" roughness={0.7} metalness={0.15} />
            </mesh>
            {/* Title */}
            <Text
                position={[0, h * 0.22, 0.025]}
                fontSize={fontSize}
                color="#f3e4b8"
                maxWidth={w - 0.12}
                anchorX="center"
                anchorY="middle"
                textAlign="center"
            >
                {title}
            </Text>
            {/* Artist · Year */}
            <Text
                position={[0, -h * 0.05, 0.025]}
                fontSize={subSize}
                color="#cfc8bd"
                maxWidth={w - 0.12}
                anchorX="center"
                anchorY="middle"
                textAlign="center"
            >
                {`${artist}${year ? ` · ${year}` : ''}`}
            </Text>
            {medium && (
                <Text
                    position={[0, -h * 0.32, 0.025]}
                    fontSize={subSize * 0.85}
                    color="#a8a097"
                    maxWidth={w - 0.12}
                    anchorX="center"
                    anchorY="middle"
                    textAlign="center"
                >
                    {medium}
                </Text>
            )}
        </group>
    )
}

/**
 * A floor-color band marking a transition between two gallery rooms.
 */
export function RoomDivider({ z = 0, width = 16, color = '#a17a32' }) {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, z]} receiveShadow>
            <planeGeometry args={[width - 0.5, 0.18]} />
            <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
        </mesh>
    )
}

/**
 * Hanging banner over a room marking the section name.
 */
export function RoomBanner({ z = 0, label = 'Gallery', accent = '#d4af37', height = 7.6, width = 4.2 }) {
    return (
        <group position={[0, height, z]}>
            <mesh castShadow>
                <boxGeometry args={[width, 0.5, 0.06]} />
                <meshStandardMaterial color="#1a1410" roughness={0.85} />
            </mesh>
            <Text
                position={[0, 0, 0.04]}
                fontSize={0.22}
                color={accent}
                maxWidth={width - 0.4}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.18}
            >
                {label.toUpperCase()}
            </Text>
        </group>
    )
}
