import React from 'react';
import { Undo2, Trash2, Save, FolderOpen, ImageDown, FileDown } from 'lucide-react';

interface PropertiesBarProps {
  color: string;
  setColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  zoom: number;
  setZoom: (z: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExportImage: () => void;
  onExportPDF: () => void;
}

export const PropertiesBar: React.FC<PropertiesBarProps> = ({
  color, setColor, strokeWidth, setStrokeWidth, zoom, setZoom, onUndo, onClear, onSave, onLoad, onExportImage, onExportPDF
}) => {
  
  const PRESET_COLORS = [
    '#ffffff', // White
    '#3794ff', // Blue
    '#2ed573', // Green
    '#ff4757', // Red
    '#ffa502', // Orange
    '#e1b12c', // Yellow (Highlighter)
    '#a55eea', // Purple
  ];

  return (
    <div className="fixed top-4 left-4 right-4 md:left-20 md:right-auto bg-[#1e1e1e] border border-[#333] rounded-full shadow-2xl px-6 py-2 flex items-center gap-4 z-50 overflow-x-auto hide-scrollbar">
      
      {/* Quick Colors */}
      <div className="flex items-center gap-2">
        {PRESET_COLORS.map(c => (
           <button
             key={c}
             onClick={() => setColor(c)}
             className={`w-5 h-5 rounded-full border border-gray-600 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
             style={{ backgroundColor: c }}
             title={c}
           />
        ))}
        {/* Custom Picker */}
        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-gray-500 ml-1">
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer p-0 border-0"
          />
        </div>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0"></div>

      {/* Stroke Width */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-500 font-bold hidden sm:inline">STROKE</span>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={strokeWidth} 
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-16 sm:w-20 accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0"></div>

      {/* Zoom */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-500 font-bold hidden sm:inline">ZOOM</span>
        <button 
          className="text-gray-400 hover:text-white px-1"
          onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
        >-</button>
        <span className="text-xs text-gray-300 w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button 
          className="text-gray-400 hover:text-white px-1"
          onClick={() => setZoom(Math.min(5, zoom + 0.1))}
        >+</button>
      </div>

      <div className="w-px h-6 bg-gray-700 flex-shrink-0"></div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onUndo} className="p-2 text-gray-400 hover:text-white transition-colors" title="Undo (Ctrl+Z)">
          <Undo2 size={18} />
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1"></div>
        <button onClick={onSave} className="p-2 text-gray-400 hover:text-white transition-colors" title="Save Project (JSON)">
          <Save size={18} />
        </button>
        <button onClick={onLoad} className="p-2 text-gray-400 hover:text-white transition-colors" title="Load Project (JSON)">
          <FolderOpen size={18} />
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1"></div>
        <button onClick={onExportImage} className="p-2 text-green-400 hover:text-green-300 transition-colors" title="Export as PNG">
          <ImageDown size={18} />
        </button>
        <button onClick={onExportPDF} className="p-2 text-red-400 hover:text-red-300 transition-colors" title="Export as PDF">
          <FileDown size={18} />
        </button>
        <div className="w-px h-4 bg-gray-800 mx-1"></div>
        <button onClick={onClear} className="p-2 text-red-400 hover:text-red-300 transition-colors" title="Clear Board">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};