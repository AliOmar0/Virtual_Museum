import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'

export default function ShareDialog({ open, onClose, url }) {
    const [copied, setCopied] = useState(false)
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(url)}`

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="dialog-backdrop"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="dialog share-dialog"
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="dialog-header">
                            <h2>Share this view</h2>
                            <button className="icon-btn" onClick={onClose}><X size={14} /></button>
                        </div>
                        <p className="dialog-help">
                            Anyone opening this link will land on the same exhibit, view mode, and lighting.
                            Scan the QR code from a phone to continue the tour there.
                        </p>
                        <div className="share-qr-row">
                            <img src={qr} alt="QR code" className="share-qr" width={200} height={200} />
                            <div className="share-url-block">
                                <input type="text" readOnly value={url} onClick={(e) => e.target.select()} />
                                <button type="button" className="btn-primary" onClick={copy}>
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copied ? 'Copied' : 'Copy link'}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
