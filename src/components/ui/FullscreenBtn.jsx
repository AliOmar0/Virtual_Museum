import React, { useCallback, useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

export default function FullscreenBtn() {
    const [isFs, setIsFs] = useState(false)

    useEffect(() => {
        const onChange = () => setIsFs(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', onChange)
        return () => document.removeEventListener('fullscreenchange', onChange)
    }, [])

    const toggle = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen()
            } else {
                await document.exitFullscreen()
            }
        } catch (e) {
            // ignore - user denied or unsupported
        }
    }, [])

    return (
        <button className="icon-btn" onClick={toggle} aria-label="Toggle fullscreen" title="Fullscreen">
            {isFs ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
    )
}
