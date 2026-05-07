import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Procedural ambient museum drone using WebAudio.
 * No external assets required. Auto-resumes on first user gesture.
 */
export function useAmbientAudio() {
    const [enabled, setEnabled] = useState(false)
    const ctxRef = useRef(null)
    const nodesRef = useRef(null)

    const ensureCtx = useCallback(() => {
        if (ctxRef.current) return ctxRef.current
        const AC = window.AudioContext || window.webkitAudioContext
        if (!AC) return null
        const ctx = new AC()
        ctxRef.current = ctx
        return ctx
    }, [])

    const buildGraph = useCallback((ctx) => {
        const master = ctx.createGain()
        master.gain.value = 0
        master.connect(ctx.destination)

        // Low pad: two slightly detuned sine oscillators
        const oscA = ctx.createOscillator()
        const oscB = ctx.createOscillator()
        const oscC = ctx.createOscillator()
        oscA.type = 'sine'
        oscB.type = 'sine'
        oscC.type = 'triangle'
        oscA.frequency.value = 110 // A2
        oscB.frequency.value = 110.4
        oscC.frequency.value = 165 // E3 (perfect fifth)

        const padGain = ctx.createGain()
        padGain.gain.value = 0.25

        // Subtle LFO for slow swell
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 0.07
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.12
        lfo.connect(lfoGain).connect(padGain.gain)

        // Lowpass for warmth
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 600

        oscA.connect(padGain)
        oscB.connect(padGain)
        oscC.connect(padGain)
        padGain.connect(lp).connect(master)

        oscA.start()
        oscB.start()
        oscC.start()
        lfo.start()

        return { master, oscA, oscB, oscC, lfo, padGain, lp }
    }, [])

    const start = useCallback(async () => {
        const ctx = ensureCtx()
        if (!ctx) return
        if (ctx.state === 'suspended') await ctx.resume()
        if (!nodesRef.current) nodesRef.current = buildGraph(ctx)
        const { master } = nodesRef.current
        const now = ctx.currentTime
        master.gain.cancelScheduledValues(now)
        master.gain.setValueAtTime(master.gain.value, now)
        master.gain.linearRampToValueAtTime(0.35, now + 1.2)
        setEnabled(true)
    }, [ensureCtx, buildGraph])

    const stop = useCallback(() => {
        const ctx = ctxRef.current
        if (!ctx || !nodesRef.current) {
            setEnabled(false)
            return
        }
        const { master } = nodesRef.current
        const now = ctx.currentTime
        master.gain.cancelScheduledValues(now)
        master.gain.setValueAtTime(master.gain.value, now)
        master.gain.linearRampToValueAtTime(0, now + 0.6)
        setEnabled(false)
    }, [])

    const toggle = useCallback(() => {
        if (enabled) stop()
        else start()
    }, [enabled, start, stop])

    useEffect(() => {
        return () => {
            const ctx = ctxRef.current
            if (ctx && ctx.state !== 'closed') {
                try { ctx.close() } catch (e) {}
            }
        }
    }, [])

    return { enabled, toggle, start, stop }
}
