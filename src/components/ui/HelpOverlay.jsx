import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const SHORTCUTS = [
    { keys: ['1', '2', '3'], label: 'Switch view: Viewer / Gallery / Grid' },
    { keys: ['←', '→'], label: 'Previous / next exhibit' },
    { keys: ['I'], label: 'Show / hide description' },
    { keys: ['F'], label: 'Toggle fullscreen' },
    { keys: ['T'], label: 'Start / stop guided tour' },
    { keys: ['/'], label: 'Open search & filters' },
    { keys: ['?'], label: 'Show this help' },
    { keys: ['Esc'], label: 'Close any open dialog' },
]

export default function HelpOverlay({ open, onClose }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="dialog help-dialog"
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-header">
                            <h2>Keyboard shortcuts</h2>
                            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                        </div>
                        <ul className="shortcut-list">
                            {SHORTCUTS.map((s) => (
                                <li key={s.label}>
                                    <span className="shortcut-keys">
                                        {s.keys.map((k, i) => (
                                            <kbd key={i}>{k}</kbd>
                                        ))}
                                    </span>
                                    <span className="shortcut-label">{s.label}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="dialog-help" style={{ marginTop: '1rem' }}>
                            Tip: drag a <strong>.glb</strong> or image file anywhere on the page to add it as an exhibit.
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
