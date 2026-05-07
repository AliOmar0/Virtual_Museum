import React from 'react'
import { Eye, Footprints, LayoutGrid, PlusCircle, Map, Sun, Moon } from 'lucide-react'

const MODES = [
    { id: 'viewer', label: 'Viewer', Icon: Eye },
    { id: 'walkable', label: 'Gallery', Icon: Footprints },
    { id: 'grid', label: 'Grid', Icon: LayoutGrid },
]

export default function Navbar({
    mode, onModeChange, onAddModel,
    lightingValue, onLightingChange,
    minimapOn, onToggleMinimap,
}) {
    return (
        <nav className="navbar">
            <div className="logo">VIRTUAL MUSEUM</div>
            <div className="mode-switch">
                {MODES.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        className={`mode-btn ${mode === id ? 'active' : ''}`}
                        onClick={() => onModeChange(id)}
                        aria-label={label}
                    >
                        <Icon size={14} />
                        <span>{label}</span>
                    </button>
                ))}

                {/* Lighting slider */}
                <div className="lighting-slider" title="Lighting: soft → dramatic">
                    <Sun size={12} />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(Math.max(0, Math.min(1, Number(lightingValue) || 0)) * 100)}
                        onChange={(e) => onLightingChange(Number(e.target.value) / 100)}
                        aria-label="Lighting intensity"
                    />
                    <Moon size={12} />
                </div>

                {mode === 'walkable' && (
                    <button
                        className={`mode-btn ${minimapOn ? 'active' : ''}`}
                        onClick={onToggleMinimap}
                        aria-label="Toggle minimap"
                        title="Toggle minimap (M)"
                    >
                        <Map size={14} />
                        <span>Map</span>
                    </button>
                )}

                <button
                    className="mode-btn add-btn"
                    onClick={onAddModel}
                    aria-label="Add 3D model"
                    title="Upload a .glb or paste a direct URL"
                >
                    <PlusCircle size={14} />
                    <span>Add</span>
                </button>
            </div>
        </nav>
    )
}
