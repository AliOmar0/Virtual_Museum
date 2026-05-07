import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Plays a looping mp3 ("lobby music") from /public/audio/lobby.mp3.
 * Path is built from import.meta.env.BASE_URL so it works locally AND on
 * GitHub Pages (where the app is served from /<repo>/).
 *
 * Volume defaults low so it sits behind the rest of the experience.
 */
export function useLobbyMusic({ initialVolume = 0.35 } = {}) {
    const audioRef = useRef(null)
    const [enabled, setEnabled] = useState(false)
    const [volume, setVolume] = useState(initialVolume)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const a = new Audio(`${import.meta.env.BASE_URL}audio/lobby.mp3`)
        a.loop = true
        a.preload = 'auto'
        a.volume = initialVolume
        a.addEventListener('canplaythrough', () => setReady(true), { once: true })
        audioRef.current = a
        return () => {
            try { a.pause() } catch {}
            audioRef.current = null
        }
    }, [initialVolume])

    useEffect(() => {
        if (!audioRef.current) return
        audioRef.current.volume = volume
    }, [volume])

    const enable = useCallback(async () => {
        const a = audioRef.current
        if (!a) return
        try {
            // Fade in for a smoother start
            a.volume = 0
            await a.play()
            setEnabled(true)
            const target = volume
            let v = 0
            const id = setInterval(() => {
                v = Math.min(target, v + 0.04)
                if (audioRef.current) audioRef.current.volume = v
                if (v >= target) clearInterval(id)
            }, 60)
        } catch (err) {
            // Browsers block autoplay until a user gesture — but this is
            // always called from a click, so this should rarely fire.
            console.warn('lobby music play blocked', err)
            setEnabled(false)
        }
    }, [volume])

    const disable = useCallback(() => {
        const a = audioRef.current
        if (!a) return
        // Fade out then pause
        const start = a.volume
        let t = 0
        const id = setInterval(() => {
            t += 0.08
            if (audioRef.current) audioRef.current.volume = Math.max(0, start * (1 - t))
            if (t >= 1) {
                clearInterval(id)
                if (audioRef.current) {
                    audioRef.current.pause()
                    audioRef.current.volume = volume
                }
            }
        }, 50)
        setEnabled(false)
    }, [volume])

    const toggle = useCallback(() => {
        if (enabled) disable(); else enable()
    }, [enabled, enable, disable])

    return { enabled, ready, toggle, enable, disable, volume, setVolume }
}
