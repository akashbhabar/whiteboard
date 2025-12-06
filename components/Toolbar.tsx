import React from 'react';
import { 
  MousePointer2, Hand, Pen, Eraser, Square, Diamond, 
  MoveRight, Type, Code, Braces, Table, Network, Highlighter
} from 'lucide-react';
import { ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  undo: () => void;
  clear: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setTool, undo, clear }) => {
  
  const tools = [
    { id: ToolType.SELECT, icon: <MousePointer2 size={18} />, group: 'basic', label: 'Select' },
    { id: ToolType.PAN, icon: <Hand size={18} />, group: 'basic', label: 'Pan' },
    { id: ToolType.PEN, icon: <Pen size={18} />, group: 'draw', label: 'Pen' },
    { id: ToolType.HIGHLIGHTER, icon: <Highlighter size={18} />, group: 'draw', label: 'Highlighter' },
    { id: ToolType.ERASER, icon: <Eraser size={18} />, group: 'draw', label: 'Eraser' },
    { id: ToolType.ARROW, icon: <MoveRight size={18} />, group: 'shapes', label: 'Arrow' },
    { id: ToolType.RECTANGLE, icon: <Square size={18} />, group: 'shapes', label: 'Box' },
    { id: ToolType.DIAMOND, icon: <Diamond size={18} />, group: 'shapes', label: 'Decision' },
    { id: ToolType.TEXT, icon: <Type size={18} />, group: 'data', label: 'Text' },
    { id: ToolType.CODE, icon: <Code size={18} />, group: 'data', label: 'Code' },
    { id: ToolType.ARRAY, icon: <Braces size={18} />, group: 'data', label: 'Array' },
    { id: ToolType.TABLE, icon: <Table size={18} />, group: 'data', label: 'Dry Run' },
    { id: ToolType.LINKED_LIST, icon: <Network size={18} />, group: 'data', label: 'Node' },
  ];

  const renderButton = (t: typeof tools[0]) => (
    <button
      key={t.id}
      onClick={() => setTool(t.id)}
      className={`p-2 rounded-lg transition-all mb-1 relative group flex justify-center items-center
        ${currentTool === t.id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      title={t.label}
    >
      {t.icon}
      <span className="absolute left-14 bg-black border border-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {t.label}
      </span>
    </button>
  );

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 bg-[#1e1e1e] border border-[#333] rounded-2xl shadow-2xl p-2 flex flex-col w-14 z-50">
      <div className="flex flex-col border-b border-gray-700 pb-2 mb-2">
        {tools.filter(t => t.group === 'basic').map(renderButton)}
      </div>
      <div className="flex flex-col border-b border-gray-700 pb-2 mb-2">
        {tools.filter(t => t.group === 'draw').map(renderButton)}
      </div>
      <div className="flex flex-col border-b border-gray-700 pb-2 mb-2">
        {tools.filter(t => t.group === 'shapes').map(renderButton)}
      </div>
      <div className="flex flex-col">
        {tools.filter(t => t.group === 'data').map(renderButton)}
      </div>
    </div>
  );
};