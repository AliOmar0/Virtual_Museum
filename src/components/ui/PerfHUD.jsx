import React, { useEffect, useRef, useState } from 'react'

export default function PerfHUD() {
    const [fps, setFps] = useState(0)
    const [frameMs, setFrameMs] = useState(0)
    const frames = useRef(0)
    const last = useRef(performance.now())
    const lastFrame = useRef(performance.now())

    useEffect(() => {
        let raf
        const tick = (t) => {
            frames.current++
            const dt = t - lastFrame.current
            lastFrame.current = t
            setFrameMs((prev) => prev * 0.9 + dt * 0.1)
            if (t - last.current >= 1000) {
                setFps(frames.current)
                frames.current = 0
                last.current = t
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(raf)
    }, [])

    const tone = fps >= 50 ? '#9ee18a' : fps >= 30 ? '#e6d27a' : '#e89292'

    return (
        <div className="perf-hud">
            <div className="perf-row">
                <span className="perf-label">FPS</span>
                <span className="perf-val" style={{ color: tone }}>{fps}</span>
            </div>
            <div className="perf-row">
                <span className="perf-label">Frame</span>
                <span className="perf-val">{frameMs.toFixed(1)}ms</span>
            </div>
        </div>
    )
}
