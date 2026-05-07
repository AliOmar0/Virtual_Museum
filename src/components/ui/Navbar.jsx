import React, { useState } from 'react'
import { Eye, Footprints, LayoutGrid, PlusCircle, Sun, Moon, MoreHorizontal } from 'lucide-react'
import MoreMenu from './MoreMenu'

const MODES = [
    { id: 'viewer', label: 'Viewer', Icon: Eye },
    { id: 'walkable', label: 'Gallery', Icon: Footprints },
    { id: 'grid', label: 'Grid', Icon: LayoutGrid },
]

export default function Navbar({
    mode, onModeChange, onAddModel,
    lightingValue, onLightingChange,
    tourActive, onToggleTour,
    onHelp, onShare, onExport, onImport,
    perfOn, onTogglePerf,
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    return (
        <nav className="navbar">
            <div className="logo">VIRTUAL MUSEUM</div>
            <div className="mode-switch">
                {MODES.map(({ id, label, Icon }) => (
                    <button key={id} className={`mode-btn ${mode === id ? 'active' : ''}`}
                        onClick={() => onModeChange(id)} aria-label={label}>
                        <Icon size={14} /><span>{label}</span>
                    </button>
                ))}

                <div className="lighting-slider" title="Lighting: soft → dramatic">
                    <Sun size={12} />
                    <input type="range" min="0" max="100"
                        value={Math.round(Math.max(0, Math.min(1, Number(lightingValue) || 0)) * 100)}
                        onChange={(e) => onLightingChange(Number(e.target.value) / 100)}
                        aria-label="Lighting intensity" />
                    <Moon size={12} />
                </div>

                <button className="mode-btn add-btn" onClick={onAddModel}
                    aria-label="Add 3D model" title="Upload a .glb, image, or paste a URL">
                    <PlusCircle size={14} /><span>Add</span>
                </button>

                <div className="more-wrap">
                    <button
                        className={`mode-btn icon-only ${menuOpen ? 'active' : ''} ${tourActive ? 'tour-on' : ''}`}
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="More options"
                        title="More — tour, share, export, help"
                    >
                        <MoreHorizontal size={14} />
                    </button>
                    <MoreMenu
                        open={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        tourActive={tourActive}
                        onToggleTour={onToggleTour}
                        onHelp={onHelp}
                        onShare={onShare}
                        onExport={onExport}
                        onImport={onImport}
                        perfOn={perfOn}
                        onTogglePerf={onTogglePerf}
                    />
                </div>
            </div>
        </nav>
    )
}
