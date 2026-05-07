import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ModelDisplay } from './ModelLoader'
import { Pedestal, ExhibitSpotlight } from './MuseumRoom'

/**
 * A complete exhibit: model placed correctly with pedestal (statues)
 * or wall-mounted (paintings), plus a directed spotlight.
 *
 * Position is the "anchor" — for statues that's the base of the pedestal on the floor;
 * for paintings that's the center of the artwork on the wall.
 */
export function Exhibit({ modelData, position = [0, 0, 0], rotationY = 0, autoRotate = false, withSpotlight = true, withPedestal = true, castShadowSpot = false }) {
    const spinRef = useRef()
    useFrame((_, dt) => {
        if (autoRotate && spinRef.current) {
            spinRef.current.rotation.y += dt * 0.2
        }
    })

    if (modelData.type === 'painting') {
        // Painting hangs flat on a wall. Rotation Y orients which wall it faces.
        const lightFrom = [
            position[0] + Math.sin(rotationY) * 2,
            position[1] + 2.0,
            position[2] + Math.cos(rotationY) * 2,
        ]
        return (
            <group position={position} rotation={[0, rotationY, 0]}>
                <ModelDisplay modelData={modelData} />
                {withSpotlight && (
                    <ExhibitSpotlight
                        from={[0, 2.0, 1.8]}
                        target={[0, 0, 0]}
                        intensity={14}
                        castShadow={castShadowSpot}
                    />
                )}
            </group>
        )
    }

    // Statue: place pedestal at floor, model on top, spotlight from above-front
    const pedestalHeight = modelData.pedestalHeight ?? 1.1
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {withPedestal && <Pedestal height={pedestalHeight} />}
            <group ref={spinRef} position={[0, pedestalHeight, 0]}>
                <ModelDisplay modelData={modelData} alignBottom />
            </group>
            {withSpotlight && (
                <ExhibitSpotlight
                    from={[0, 6, 2.5]}
                    target={[0, pedestalHeight + 0.8, 0]}
                    intensity={20}
                    castShadow={castShadowSpot}
                />
            )}
        </group>
    )
}
