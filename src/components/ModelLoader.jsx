import React, { Suspense, lazy, useEffect, useRef, useMemo, useState, useLayoutEffect, Component } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

const enhancedMaterials = new WeakSet()

const builtInModels = {
    "TheStarryNight_painting": lazy(() =>
        import('../../HeroModels/TheStarryNight_painting').then((m) => ({ default: m.Model }))
    ),
    "Angel_old_marble_version": lazy(() =>
        import('../../HeroModels/Angel_old_marble_version').then((m) => ({ default: m.Model }))
    ),
    "Death_crowning_innocence_1896_Painting": lazy(() =>
        import('../../HeroModels/Death_crowning_innocence_1896_Painting').then((m) => ({ default: m.Model }))
    ),
    "Frank": lazy(() =>
        import('../../HeroModels/Frank').then((m) => ({ default: m.Model }))
    ),
    "Laocoon_and_his_sons": lazy(() =>
        import('../../HeroModels/Laocoon_and_his_sons').then((m) => ({ default: m.Model }))
    ),
    "Louis_xiv_de_france_louvre_paris": lazy(() =>
        import('../../HeroModels/Louis_xiv_de_france_louvre_paris').then((m) => ({ default: m.Model }))
    ),
    "Painting_by_zdzislaw_beksinski_2": lazy(() =>
        import('../../HeroModels/Painting_by_zdzislaw_beksinski_2').then((m) => ({ default: m.Model }))
    ),
    "The_thinker_by_auguste_rodin": lazy(() =>
        import('../../HeroModels/The_thinker_by_auguste_rodin').then((m) => ({ default: m.Model }))
    ),
}

function RemoteGLB({ url }) {
    const { scene } = useGLTF(url)
    const cloned = useMemo(() => scene.clone(true), [scene])
    return <primitive object={cloned} />
}

function enhanceMaterials(root, type = 'statue') {
    root.traverse((obj) => {
        if (obj.isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
            mats.forEach((m) => {
                if (!m) return
                if (m.map) {
                    m.map.anisotropy = 8
                    m.map.colorSpace = THREE.SRGBColorSpace
                }
                // Paintings: render both sides so it doesn't matter which face
                // the GLB exporter chose for the artwork. Also push the diffuse
                // texture into the emissive channel so the painting is always
                // visible — even when the front face ends up against a wall in
                // the gallery, or when the room lighting is dim. This mimics
                // the way real museum paintings are independently spot-lit.
                if (type === 'painting') {
                    m.side = THREE.DoubleSide
                    if (m.map && 'emissive' in m) {
                        m.emissive = new THREE.Color(0xffffff)
                        m.emissiveMap = m.map
                        m.emissiveIntensity = 0.55
                    }
                }
                if (enhancedMaterials.has(m)) return
                if ('envMapIntensity' in m) m.envMapIntensity = 1.1
                if ('roughness' in m && m.roughness === 0) m.roughness = 0.4
                m.needsUpdate = true
                enhancedMaterials.add(m)
            })
        }
    })
}

class GLBErrorBoundary extends Component {
    constructor(props) { super(props); this.state = { hasError: false } }
    static getDerivedStateFromError() { return { hasError: true } }
    componentDidCatch(err) { console.warn('Model failed to load:', err) }
    render() {
        if (this.state.hasError) {
            return (
                <Html center>
                    <div className="canvas-loading" style={{ background: 'rgba(80,20,20,0.7)' }}>
                        <span>Failed to load model</span>
                    </div>
                </Html>
            )
        }
        return this.props.children
    }
}

/**
 * Measures the bounding box of children once they mount and applies:
 *  - uniform scale so the appropriate dimension equals targetSize
 *  - X/Z centering
 *  - Y: center if alignBottom=false, or place bottom on y=0 if alignBottom=true
 *
 * This is much more reliable than drei's <Center> for async-loaded GLTFs.
 */
function AutoFit({ children, type = 'statue', alignBottom = false, targetSize, extraScale = 1, paintingFlip = false, onReady }) {
    const outer = useRef()
    const inner = useRef()
    const [ready, setReady] = useState(false)

    useLayoutEffect(() => {
        let cancelled = false
        let raf = 0
        let attempts = 0
        const MAX_ATTEMPTS = 120 // ~2s at 60fps before giving up
        const tryFit = () => {
            if (cancelled) return
            const i = inner.current
            const o = outer.current
            if (!i || !o) { raf = requestAnimationFrame(tryFit); return }

            // Reset before measuring so re-fits work correctly
            i.rotation.set(0, 0, 0)
            i.position.set(0, 0, 0)
            o.scale.setScalar(1)
            i.updateMatrixWorld(true)

            let box = new THREE.Box3().setFromObject(i)
            if (box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) {
                if (++attempts < MAX_ATTEMPTS) {
                    raf = requestAnimationFrame(tryFit)
                } else {
                    // Give up gracefully — show as-is so user at least sees something
                    setReady(true)
                    if (onReady) onReady()
                }
                return
            }
            let size = new THREE.Vector3(); box.getSize(size)

            // For paintings, auto-orient: the smallest bbox dimension is the
            // painting's depth/thickness, and that axis should align with local Z
            // so the painting hangs flat. This handles inconsistent GLB exports.
            if (type === 'painting') {
                const sx = size.x, sy = size.y, sz = size.z
                if (sx <= sy && sx <= sz) {
                    // depth is X → rotate to bring X-normal onto Z
                    i.rotation.set(0, Math.PI / 2, 0)
                } else if (sy <= sx && sy <= sz) {
                    // depth is Y → rotate to bring Y-normal onto Z
                    i.rotation.set(Math.PI / 2, 0, 0)
                }
                // Some painting GLBs are authored facing -Z (canvas back to
                // the room). paintingFlip adds an extra 180° yaw so the
                // textured face ends up toward the viewer.
                if (paintingFlip) {
                    i.rotation.y += Math.PI
                }
                i.updateMatrixWorld(true)
                box = new THREE.Box3().setFromObject(i)
                size = new THREE.Vector3(); box.getSize(size)
            }

            const center = new THREE.Vector3(); box.getCenter(center)

            // Normalize:
            // - paintings: max(width, height) ignoring depth — so a thick frame
            //   doesn't tank the size
            // - statues: height
            const dim = type === 'painting'
                ? Math.max(size.x, size.y, 0.001)
                : Math.max(size.y, 0.001)
            const defaultTarget = type === 'painting' ? 2.4 : 1.6
            const s = (targetSize || defaultTarget) / dim * extraScale

            o.scale.setScalar(s)
            // After rotation, position is in inner's local frame (pre-rotation),
            // so translate the bbox center to origin in that frame.
            // We compute the rotation-adjusted offset by transforming center back.
            const invRot = new THREE.Matrix4().makeRotationFromEuler(i.rotation).invert()
            const localCenter = center.clone().applyMatrix4(invRot)
            const localMinY = alignBottom
                ? new THREE.Vector3(0, box.min.y, 0).applyMatrix4(invRot).y
                : 0

            i.position.set(
                -localCenter.x,
                alignBottom ? -localMinY : -localCenter.y,
                -localCenter.z
            )

            enhanceMaterials(i, type)
            setReady(true)
            if (onReady) onReady()
        }
        tryFit()
        return () => { cancelled = true; if (raf) cancelAnimationFrame(raf) }
    }, [type, alignBottom, targetSize, extraScale, paintingFlip])

    return (
        <group ref={outer} visible={ready}>
            <group ref={inner}>{children}</group>
        </group>
    )
}

/**
 * Renders a model from the built-in registry or from a remote .glb URL,
 * auto-normalized to a consistent display size with proper bottom alignment
 * for statues.
 */
function ImagePlane({ url }) {
    const tex = useMemo(() => {
        const loader = new THREE.TextureLoader()
        loader.setCrossOrigin('anonymous')
        const t = loader.load(url)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        return t
    }, [url])
    const [aspect, setAspect] = useState(1)
    useEffect(() => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => setAspect(img.naturalWidth / img.naturalHeight)
        img.src = url
    }, [url])
    // Build a flat slab: face + thin frame backer for a paintinglike depth
    return (
        <group>
            {/* Frame backer */}
            <mesh position={[0, 0, -0.025]} castShadow receiveShadow>
                <boxGeometry args={[aspect * 1.06, 1.06, 0.05]} />
                <meshStandardMaterial color="#1a140d" roughness={0.7} metalness={0.2} />
            </mesh>
            {/* Image plane (front face) */}
            <mesh castShadow>
                <planeGeometry args={[aspect, 1]} />
                <meshStandardMaterial map={tex} roughness={0.9} metalness={0} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

export function ModelDisplay({ modelData, alignBottom = false, targetSize, extraScale = 1 }) {
    const ModelComp = !modelData.remoteUrl && !modelData.imageUrl
        ? builtInModels[modelData.file] : null

    // User-tweakable transforms saved with the model. tilt is [x,y,z] in
    // radians; yOffset lifts/lowers the model relative to its anchor (floor
    // for statues, wall center for paintings).
    const tilt = modelData.tilt || [0, 0, 0]
    const yOffset = modelData.yOffset || 0

    return (
        <GLBErrorBoundary>
            <Suspense fallback={null}>
                <group rotation={tilt} position={[0, yOffset, 0]}>
                    <AutoFit
                        type={modelData.type}
                        alignBottom={alignBottom}
                        targetSize={targetSize ?? modelData.targetSize}
                        extraScale={extraScale * (modelData.fineScale || modelData.scale || 1)}
                        paintingFlip={!!modelData.paintingFlip}
                    >
                        {modelData.imageUrl ? (
                            <ImagePlane url={modelData.imageUrl} />
                        ) : modelData.remoteUrl ? (
                            <RemoteGLB url={modelData.remoteUrl} />
                        ) : ModelComp ? (
                            <ModelComp />
                        ) : null}
                    </AutoFit>
                </group>
            </Suspense>
        </GLBErrorBoundary>
    )
}

export function ModelLoadingFallback() {
    return (
        <Html center>
            <div className="canvas-loading">
                <div className="canvas-loading-dot" />
                <span>Loading exhibit…</span>
            </div>
        </Html>
    )
}
