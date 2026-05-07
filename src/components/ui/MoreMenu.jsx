import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    PlayCircle, StopCircle, HelpCircle, Share2, Download, Upload, Activity,
} from 'lucide-react'

export default function MoreMenu({
    open, onClose,
    tourActive, onToggleTour,
    onHelp, onShare, onExport, onImport,
    perfOn, onTogglePerf,
}) {
    const ref = useRef(null)
    useEffect(() => {
        if (!open) return
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open, onClose])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={ref}
                    className="more-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                >
                    <button onClick={() => { onToggleTour(); onClose() }}>
                        {tourActive ? <StopCircle size={14} /> : <PlayCircle size={14} />}
                        <span>{tourActive ? 'Stop guided tour' : 'Start guided tour'}</span>
                    </button>
                    <button onClick={() => { onShare(); onClose() }}>
                        <Share2 size={14} /><span>Share this view…</span>
                    </button>
                    <button onClick={() => { onExport(); onClose() }}>
                        <Download size={14} /><span>Export gallery (JSON)</span>
                    </button>
                    <button onClick={() => { onImport(); onClose() }}>
                        <Upload size={14} /><span>Import gallery…</span>
                    </button>
                    <button onClick={() => { onTogglePerf(); onClose() }}>
                        <Activity size={14} />
                        <span>{perfOn ? 'Hide performance HUD' : 'Show performance HUD'}</span>
                    </button>
                    <div className="more-menu-divider" />
                    <button onClick={() => { onHelp(); onClose() }}>
                        <HelpCircle size={14} /><span>Keyboard shortcuts</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
