import React from 'react'
import { Eye, Footprints, LayoutGrid, PlusCircle } from 'lucide-react'

const MODES = [
    { id: 'viewer', label: 'Viewer', Icon: Eye },
    { id: 'walkable', label: 'Gallery', Icon: Footprints },
    { id: 'grid', label: 'Grid', Icon: LayoutGrid },
]

export default function Navbar({ mode, onModeChange, onAddModel }) {
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
                <button
                    className="mode-btn add-btn"
                    onClick={onAddModel}
                    aria-label="Add 3D model"
                    title="Add a 3D model from URL"
                >
                    <PlusCircle size={14} />
                    <span>Add</span>
                </button>
            </div>
        </nav>
    )
}
