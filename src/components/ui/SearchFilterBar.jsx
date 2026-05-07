import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Heart } from 'lucide-react'
import { CATEGORIES } from '../../data/models'

export default function SearchFilterBar({
    open, onClose,
    query, onQuery,
    section, onSection,
    favoritesOnly, onToggleFavorites,
    resultCount, totalCount,
}) {
    const inputRef = useRef(null)
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="search-bar"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.18 }}
                >
                    <div className="search-input-row">
                        <Search size={14} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => onQuery(e.target.value)}
                            placeholder="Search exhibits, artists, descriptions…"
                        />
                        <span className="search-count">{resultCount}/{totalCount}</span>
                        <button className="icon-btn" onClick={onClose} aria-label="Close search">
                            <X size={12} />
                        </button>
                    </div>
                    <div className="filter-pills">
                        <button
                            className={`pill ${section === 'all' ? 'active' : ''}`}
                            onClick={() => onSection('all')}
                        >All</button>
                        {CATEGORIES.map((c) => (
                            <button
                                key={c.id}
                                className={`pill ${section === c.id ? 'active' : ''}`}
                                onClick={() => onSection(c.id)}
                            >{c.label}</button>
                        ))}
                        <button
                            className={`pill heart-pill ${favoritesOnly ? 'active' : ''}`}
                            onClick={onToggleFavorites}
                            title="Show favorites only"
                        >
                            <Heart size={12} fill={favoritesOnly ? 'currentColor' : 'none'} />
                            <span>Favorites</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
