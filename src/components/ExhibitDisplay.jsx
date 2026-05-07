import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ModelDisplay } from './ModelLoader'
import { Pedestal, ExhibitSpotlight } from './MuseumRoom'

/**
 * A complete exhibit: model placed correctly with pedestal (statues)
 * or wall-mounted (paintings), plus an optional spotlight.
 *
 * `position` is the floor anchor for statues, or the wall anchor (center of
 * artwork on the wall) for paintings.
 */
export function Exhibit({
    modelData,
    position = [0, 0, 0],
    rotationY = 0,
    autoRotate = false,
    withSpotlight = true,
    withPedestal = true,
    castShadowSpot = false,
    targetSize,
}) {
    const spinRef = useRef()
    useFrame((_, dt) => {
        if (autoRotate && spinRef.current) {
            spinRef.current.rotation.y += dt * 0.2
        }
    })

    if (modelData.type === 'painting') {
        // Painting hangs flat on a wall. Rotation Y orients which wall it faces.
        // ModelDisplay normalizes the painting to ~targetSize meters and centers it.
        return (
            <group position={position} rotation={[0, rotationY, 0]}>
                <ModelDisplay modelData={modelData} targetSize={targetSize} />
                {withSpotlight && (
                    <ExhibitSpotlight
                        from={[0, 1.4, 1.6]}
                        target={[0, 0, 0]}
                        intensity={10}
                        castShadow={castShadowSpot}
                    />
                )}
            </group>
        )
    }

    // Statue: pedestal sits at floor, model bottom-aligned on top of pedestal
    const pedestalHeight = withPedestal ? (modelData.pedestalHeight ?? 1.0) : 0
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {withPedestal && <Pedestal height={pedestalHeight} />}
            <group ref={spinRef} position={[0, pedestalHeight, 0]}>
                <ModelDisplay modelData={modelData} alignBottom targetSize={targetSize} />
            </group>
            {withSpotlight && (
                <ExhibitSpotlight
                    from={[0, pedestalHeight + 4, 2.2]}
                    target={[0, pedestalHeight + 0.8, 0]}
                    intensity={18}
                    castShadow={castShadowSpot}
                />
            )}
        </group>
    )
}
