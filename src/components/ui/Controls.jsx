import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function Controls({ index, total, onPrev, onNext }) {
    return (
        <div className="controls">
            <button className="control-btn" onClick={onPrev} aria-label="Previous"><ArrowLeft size={16} /></button>
            <div className="index-counter">
                {(index + 1).toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
            </div>
            <button className="control-btn" onClick={onNext} aria-label="Next"><ArrowRight size={16} /></button>
        </div>
    )
}
