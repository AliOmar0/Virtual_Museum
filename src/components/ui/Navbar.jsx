import React from 'react'
import { Eye, Footprints, LayoutGrid, PlusCircle, Sun, Moon } from 'lucide-react'

const MODES = [
    { id: 'viewer', label: 'Viewer', Icon: Eye },
    { id: 'walkable', label: 'Gallery', Icon: Footprints },
    { id: 'grid', label: 'Grid', Icon: LayoutGrid },
]

export default function Navbar({ mode, onModeChange, onAddModel, dramatic, onToggleDramatic }) {
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
                    className={`mode-btn ${dramatic ? 'active' : ''}`}
                    onClick={onToggleDramatic}
                    aria-label="Toggle dramatic lighting"
                    title={dramatic ? 'Switch to soft lighting' : 'Switch to dramatic lighting'}
                >
                    {dramatic ? <Moon size={14} /> : <Sun size={14} />}
                    <span>{dramatic ? 'Dramatic' : 'Soft'}</span>
                </button>
                <button
                    className="mode-btn add-btn"
                    onClick={onAddModel}
                    aria-label="Add 3D model"
                    title="Upload a .glb file or paste a direct URL"
                >
                    <PlusCircle size={14} />
                    <span>Add</span>
                </button>
            </div>
        </nav>
    )
}
