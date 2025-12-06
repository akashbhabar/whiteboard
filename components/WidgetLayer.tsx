
import React from 'react';
import { Camera, ArrayWidget, TableWidget, CanvasElement, CodeElement, TextWidget } from '../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface WidgetLayerProps {
  elements: CanvasElement[];
  camera: Camera;
  updateElement: (id: string, data: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
}

export const WidgetLayer: React.FC<WidgetLayerProps> = ({ elements, camera, updateElement, removeElement }) => {
  
  const handleArrayUpdate = (id: string, newData: string[]) => {
    updateElement(id, { data: newData } as Partial<ArrayWidget>);
  };

  const handleTableUpdate = (id: string, newData: { label: string; value: string }[]) => {
    updateElement(id, { data: newData } as Partial<TableWidget>);
  };

  const handleCodeUpdate = (id: string, newContent: string) => {
    updateElement(id, { content: newContent } as Partial<CodeElement>);
  }

  const handleTextUpdate = (id: string, newContent: string) => {
    updateElement(id, { content: newContent } as Partial<TextWidget>);
  }

  const getStyle = (el: CanvasElement): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${el.x * camera.z + camera.x}px, ${el.y * camera.z + camera.y}px) scale(${camera.z})`,
    transformOrigin: 'top left',
    pointerEvents: 'auto', // Allow interaction
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {elements.map(el => {
        if (el.type === 'widget_array') {
          const arrEl = el as ArrayWidget;
          return (
            <div key={el.id} style={getStyle(el)} onMouseDown={e => e.stopPropagation()} className="flex flex-col items-center bg-[#121212]/90 p-2 rounded-lg border border-dashed border-gray-700 shadow-xl group">
              {/* Indices */}
              <div className="flex gap-0 mb-1">
                 {arrEl.data.map((_, idx) => (
                   <div key={idx} className="w-10 text-center text-xs text-blue-400 font-mono">{idx}</div>
                 ))}
              </div>
              {/* Cells */}
              <div className="flex border-2 border-blue-500 bg-black">
                {arrEl.data.map((val, idx) => (
                  <input
                    key={idx}
                    value={val}
                    onChange={(e) => {
                      const newData = [...arrEl.data];
                      newData[idx] = e.target.value;
                      handleArrayUpdate(el.id, newData);
                    }}
                    className="w-10 h-10 bg-transparent border-r border-blue-500 text-white text-center font-mono outline-none last:border-r-0 focus:bg-blue-900/30"
                  />
                ))}
              </div>
              {/* Controls */}
              <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleArrayUpdate(el.id, [...arrEl.data, '0'])}
                  className="p-1 bg-green-600 rounded-full hover:bg-green-500"
                ><Plus size={12} color="white" /></button>
                <button 
                  onClick={() => handleArrayUpdate(el.id, arrEl.data.slice(0, -1))}
                  className="p-1 bg-red-600 rounded-full hover:bg-red-500"
                ><MinusIcon /></button>
                <button onClick={() => removeElement(el.id)} className="p-1 bg-gray-600 rounded-full hover:bg-gray-500">
                  <X size={12} color="white" />
                </button>
              </div>
            </div>
          );
        }

        if (el.type === 'widget_table') {
          const tblEl = el as TableWidget;
          return (
            <div key={el.id} style={getStyle(el)} onMouseDown={e => e.stopPropagation()} className="bg-black/90 border border-green-500/50 rounded shadow-xl min-w-[200px] group">
              <div className="grid grid-cols-2 bg-green-500/20 border-b border-green-500/50 p-1">
                <div className="text-green-400 font-mono text-xs font-bold text-center">Variable</div>
                <div className="text-green-400 font-mono text-xs font-bold text-center">Value</div>
              </div>
              {tblEl.data.map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 border-b border-gray-800 last:border-0">
                  <input 
                    value={row.label}
                    onChange={(e) => {
                      const newData = [...tblEl.data];
                      newData[idx].label = e.target.value;
                      handleTableUpdate(el.id, newData);
                    }}
                    className="bg-transparent text-gray-400 font-mono text-sm p-1 text-center border-r border-gray-800 outline-none"
                    placeholder="var"
                  />
                  <input 
                    value={row.value}
                    onChange={(e) => {
                      const newData = [...tblEl.data];
                      newData[idx].value = e.target.value;
                      handleTableUpdate(el.id, newData);
                    }}
                    className="bg-transparent text-white font-mono text-sm p-1 text-center outline-none"
                    placeholder="val"
                  />
                </div>
              ))}
               <div className="flex justify-center gap-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleTableUpdate(el.id, [...tblEl.data, { label: '', value: '' }])}
                  className="p-1 bg-green-600 rounded-full hover:bg-green-500"
                ><Plus size={12} color="white" /></button>
                 <button 
                  onClick={() => {
                     if(tblEl.data.length > 0) handleTableUpdate(el.id, tblEl.data.slice(0, -1));
                  }}
                  className="p-1 bg-red-600 rounded-full hover:bg-red-500"
                ><MinusIcon /></button>
                <button onClick={() => removeElement(el.id)} className="p-1 bg-gray-600 rounded-full hover:bg-gray-500">
                  <X size={12} color="white" />
                </button>
              </div>
            </div>
          );
        }

        if (el.type === 'widget_code') {
           const codeEl = el as CodeElement;
           return (
             <div key={el.id} style={getStyle(el)} onMouseDown={e => e.stopPropagation()} className="group relative">
                <textarea
                  value={codeEl.content}
                  onChange={(e) => handleCodeUpdate(el.id, e.target.value)}
                  className="bg-[#0d1117] text-[#c9d1d9] font-mono text-sm p-3 rounded border border-gray-700 outline-none resize min-w-[200px] min-h-[100px] shadow-lg focus:border-blue-500 transition-colors"
                  placeholder="// Write code here..."
                  spellCheck={false}
                />
                <button 
                  onClick={() => removeElement(el.id)} 
                  className="absolute -top-3 -right-3 p-1 bg-gray-700 rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <X size={12} color="white" />
                </button>
             </div>
           )
        }

        if (el.type === 'widget_text') {
            const textEl = el as TextWidget;
            return (
              <div key={el.id} style={getStyle(el)} onMouseDown={e => e.stopPropagation()} className="group relative">
                 <textarea
                   value={textEl.content}
                   onChange={(e) => handleTextUpdate(el.id, e.target.value)}
                   className="bg-transparent text-gray-200 font-sans border border-transparent hover:border-dashed hover:border-gray-600 focus:border-blue-500 outline-none resize overflow-hidden p-1 leading-normal"
                   style={{ fontSize: (textEl.fontSize || 20) + 'px', width: textEl.width ? textEl.width + 'px' : '200px', height: textEl.height ? textEl.height + 'px' : 'auto' }}
                   onMouseUp={(e) => {
                       const target = e.target as HTMLTextAreaElement;
                       updateElement(el.id, { width: target.clientWidth, height: target.clientHeight } as any);
                   }}
                   placeholder="Type text here..."
                 />
                 <button 
                   onClick={() => removeElement(el.id)} 
                   className="absolute -top-3 -right-3 p-1 bg-gray-700 rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30"
                 >
                   <X size={12} color="white" />
                 </button>
              </div>
            )
        }

        return null;
      })}
    </div>
  );
};

const MinusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
