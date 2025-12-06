import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toolbar } from './components/Toolbar';
import { PropertiesBar } from './components/PropertiesBar';
import { WidgetLayer } from './components/WidgetLayer';
import { 
  ToolType, Camera, Point, CanvasElement, 
  PathElement, ShapeElement, TextWidget, 
  ArrayWidget, TableWidget, CodeElement 
} from './types';
import { generateId, screenToWorld, getDistance } from './utils';
import { jsPDF } from 'jspdf';

const GRID_SIZE = 50;

function App() {
  // State
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, z: 1 });
  const [tool, setTool] = useState<ToolType>(ToolType.PEN);
  const [color, setColor] = useState('#3794ff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for performance-critical drawing
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);
  const dragStartRef = useRef<Point | null>(null);

  // --- Drawing Logic ---

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    // Calculate visible grid range
    const startX = Math.floor((-camera.x / camera.z) / GRID_SIZE) * GRID_SIZE;
    const startY = Math.floor((-camera.y / camera.z) / GRID_SIZE) * GRID_SIZE;
    const endX = startX + (window.innerWidth / camera.z) + GRID_SIZE;
    const endY = startY + (window.innerHeight / camera.z) + GRID_SIZE;

    ctx.beginPath();
    // Dot grid
    for (let x = startX; x < endX; x += GRID_SIZE) {
        for (let y = startY; y < endY; y += GRID_SIZE) {
            ctx.moveTo(x + 2, y);
            ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
    }
    ctx.fill();
    ctx.restore();
  };

  const drawElement = (ctx: CanvasRenderingContext2D, el: CanvasElement) => {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color;
    // @ts-ignore
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = el.opacity || 1;

    if (el.type === 'path') {
      const path = el as PathElement;
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        // Simple smoothing could be added here
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    } else if (el.type === 'shape') {
      const shape = el as ShapeElement;
      ctx.beginPath();
      if (shape.shapeType === 'rectangle') {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.shapeType === 'diamond') {
        const w = shape.width;
        const h = shape.height;
        ctx.moveTo(shape.x + w / 2, shape.y);
        ctx.lineTo(shape.x + w, shape.y + h / 2);
        ctx.lineTo(shape.x + w / 2, shape.y + h);
        ctx.lineTo(shape.x, shape.y + h / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (shape.shapeType === 'arrow') {
         // Simplified arrow
         const toX = shape.x + shape.width;
         const toY = shape.y + shape.height;
         const headlen = 15;
         const angle = Math.atan2(toY - shape.y, toX - shape.x);
         ctx.moveTo(shape.x, shape.y);
         ctx.lineTo(toX, toY);
         ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
         ctx.moveTo(toX, toY);
         ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
         ctx.stroke();
      } else if (shape.shapeType === 'linkedlist') {
         const w = 80; const h = 40;
         ctx.strokeRect(shape.x, shape.y - h/2, w, h);
         // Separator
         ctx.beginPath();
         ctx.moveTo(shape.x + w * 0.7, shape.y - h/2);
         ctx.lineTo(shape.x + w * 0.7, shape.y + h/2);
         ctx.stroke();
         // Dot
         ctx.beginPath();
         ctx.arc(shape.x + w * 0.85, shape.y, 3, 0, Math.PI*2);
         ctx.fill();
         // Arrow
         ctx.beginPath();
         ctx.moveTo(shape.x + w, shape.y);
         ctx.lineTo(shape.x + w + 20, shape.y);
         ctx.stroke();
      }
    }
    ctx.restore();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset and Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Camera
    ctx.setTransform(camera.z, 0, 0, camera.z, camera.x, camera.y);

    drawGrid(ctx);

    // Draw saved elements
    elements.forEach(el => drawElement(ctx, el));

    // Draw current action preview
    if (isDrawingRef.current) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (tool === ToolType.HIGHLIGHTER) {
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = strokeWidth + 10; // Highlighters are thicker
        }

        if (tool === ToolType.PEN || tool === ToolType.HIGHLIGHTER || tool === ToolType.ERASER) {
             if (tool === ToolType.ERASER) {
                 ctx.strokeStyle = '#ff0000';
                 ctx.lineWidth = strokeWidth * 4;
                 ctx.globalAlpha = 0.5;
             }
             const points = currentPathRef.current;
             if (points.length > 0) {
                 ctx.beginPath();
                 ctx.moveTo(points[0].x, points[0].y);
                 for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                 ctx.stroke();
             }
        } else if (startPointRef.current && currentPathRef.current.length > 0) {
            // Preview shapes
            const end = currentPathRef.current[currentPathRef.current.length - 1];
            const start = startPointRef.current;
            const w = end.x - start.x;
            const h = end.y - start.y;

            if (tool === ToolType.RECTANGLE) {
                ctx.strokeRect(start.x, start.y, w, h);
            } else if (tool === ToolType.DIAMOND) {
                ctx.beginPath();
                ctx.moveTo(start.x + w/2, start.y);
                ctx.lineTo(start.x + w, start.y + h/2);
                ctx.lineTo(start.x + w/2, start.y + h);
                ctx.lineTo(start.x, start.y + h/2);
                ctx.closePath();
                ctx.stroke();
            } else if (tool === ToolType.ARROW) {
                // Preview arrow
                 const headlen = 15;
                 const angle = Math.atan2(end.y - start.y, end.x - start.x);
                 ctx.beginPath();
                 ctx.moveTo(start.x, start.y);
                 ctx.lineTo(end.x, end.y);
                 ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
                 ctx.moveTo(end.x, end.y);
                 ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
                 ctx.stroke();
            }
        }
        ctx.restore();
    }

  }, [elements, camera, tool, color, strokeWidth]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Window resize handling
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            renderCanvas();
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);


  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = { x: e.clientX, y: e.clientY };
    const worldPt = screenToWorld(pt, camera);

    // Right click or Space+Click or Pan Tool = Pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && tool === ToolType.PAN)) {
        setIsDragging(true);
        dragStartRef.current = pt;
        return;
    }
    
    // Normal Tools
    if (e.button === 0) {
        if ([ToolType.ARRAY, ToolType.TABLE, ToolType.CODE, ToolType.TEXT, ToolType.LINKED_LIST].includes(tool)) {
            // Immediate placement tools
            createWidget(worldPt);
            return;
        }

        isDrawingRef.current = true;
        startPointRef.current = worldPt;
        currentPathRef.current = [worldPt];
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = { x: e.clientX, y: e.clientY };
    const worldPt = screenToWorld(pt, camera);

    if (isDragging && dragStartRef.current) {
        const dx = pt.x - dragStartRef.current.x;
        const dy = pt.y - dragStartRef.current.y;
        setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        dragStartRef.current = pt;
        return;
    }

    if (isDrawingRef.current) {
        currentPathRef.current.push(worldPt);
        renderCanvas(); // Force re-render for preview
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
        setIsDragging(false);
        dragStartRef.current = null;
        return;
    }

    if (isDrawingRef.current && startPointRef.current) {
        isDrawingRef.current = false;
        const endPt = screenToWorld({ x: e.clientX, y: e.clientY }, camera);
        const path = currentPathRef.current;
        
        // Commit element
        if (tool === ToolType.PEN || tool === ToolType.HIGHLIGHTER) {
            const isHighlighter = tool === ToolType.HIGHLIGHTER;
            const newEl: PathElement = {
                id: generateId(), type: 'path',
                points: path, color: color, strokeWidth: isHighlighter ? strokeWidth + 10 : strokeWidth, 
                x:0, y:0, opacity: isHighlighter ? 0.4 : 1
            };
            setElements(prev => [...prev, newEl]);
        } else if (tool === ToolType.ERASER) {
             // Simple eraser
             setElements(prev => prev.filter(el => {
                if (el.type === 'path') {
                   const p = el as PathElement;
                   for(let pt of path) {
                      for(let elPt of p.points) {
                         if(getDistance(pt, elPt) < 20) return false;
                      }
                   }
                }
                return true; 
             }));
        } else if ([ToolType.RECTANGLE, ToolType.DIAMOND, ToolType.ARROW].includes(tool)) {
            const w = endPt.x - startPointRef.current.x;
            const h = endPt.y - startPointRef.current.y;
            // Avoid tiny shapes
            if (Math.abs(w) > 5 || Math.abs(h) > 5) {
                const shapeType = tool === ToolType.RECTANGLE ? 'rectangle' : tool === ToolType.DIAMOND ? 'diamond' : 'arrow';
                const newEl: ShapeElement = {
                    id: generateId(), type: 'shape', shapeType: shapeType as any,
                    x: startPointRef.current.x, y: startPointRef.current.y,
                    width: w, height: h, color: color, strokeWidth: strokeWidth
                };
                setElements(prev => [...prev, newEl]);
            }
        }
    }
    currentPathRef.current = [];
    startPointRef.current = null;
    renderCanvas();
  };

  const handleWheel = (e: React.WheelEvent) => {
     const scaleAmount = -e.deltaY * 0.001;
     const newZoom = Math.min(Math.max(0.1, camera.z * (1 + scaleAmount)), 5);
     const mouse = { x: e.clientX, y: e.clientY };
     const worldMouseBefore = screenToWorld(mouse, camera);
     const worldMouseAfter = screenToWorld(mouse, { ...camera, z: newZoom });
     const dx = (worldMouseAfter.x - worldMouseBefore.x) * newZoom;
     const dy = (worldMouseAfter.y - worldMouseBefore.y) * newZoom;

     setCamera(prev => ({ x: prev.x + dx, y: prev.y + dy, z: newZoom }));
  };

  // --- Widget Creation ---
  const createWidget = (pos: Point) => {
     if (tool === ToolType.ARRAY) {
         const el: ArrayWidget = {
             id: generateId(), type: 'widget_array', x: pos.x, y: pos.y, color: color,
             data: ['10', '20', '30', '40']
         };
         setElements(prev => [...prev, el]);
     } else if (tool === ToolType.TABLE) {
         const el: TableWidget = {
             id: generateId(), type: 'widget_table', x: pos.x, y: pos.y, color: color,
             data: [{ label: 'i', value: '0' }, { label: 'j', value: '1' }]
         };
         setElements(prev => [...prev, el]);
     } else if (tool === ToolType.CODE) {
          const el: CodeElement = {
              id: generateId(), type: 'widget_code', x: pos.x, y: pos.y, color: color,
              content: ''
          };
          setElements(prev => [...prev, el]);
     } else if (tool === ToolType.TEXT) {
         const el: TextWidget = {
             id: generateId(), type: 'widget_text', x: pos.x, y: pos.y, color: color,
             content: '', fontSize: 20
         };
         setElements(prev => [...prev, el]);
     } else if (tool === ToolType.LINKED_LIST) {
         const el: ShapeElement = {
             id: generateId(), type: 'shape', shapeType: 'linkedlist',
             x: pos.x, y: pos.y, width: 80, height: 40, color: color, strokeWidth: 2
         };
         setElements(prev => [...prev, el]);
     }
     setTool(ToolType.SELECT);
  };

  const updateElement = (id: string, data: Partial<CanvasElement>) => {
      setElements(prev => prev.map(el => el.id === id ? { ...el, ...data } : el));
  };

  const removeElement = (id: string) => {
      setElements(prev => prev.filter(el => el.id !== id));
  };

  const handleSave = () => {
    const data = JSON.stringify(elements);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devboard-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const loadedElements = JSON.parse(json);
                if (Array.isArray(loadedElements)) setElements(loadedElements);
            } catch (err) {
                alert("Invalid project file");
            }
        };
        reader.readAsText(file);
    };
    input.click();
  };

  // --- Export Logic ---
  const generateExportCanvas = (): HTMLCanvasElement => {
      // 1. Calculate Bounding Box
      if (elements.length === 0) return document.createElement('canvas');
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      elements.forEach(el => {
          if (el.type === 'path') {
              (el as PathElement).points.forEach(p => {
                  minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                  maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
              });
          } else {
             // For shapes/widgets, roughly estimate size
             minX = Math.min(minX, el.x); minY = Math.min(minY, el.y);
             const w = el.width || 200;
             const h = el.height || 100;
             maxX = Math.max(maxX, el.x + w); maxY = Math.max(maxY, el.y + h);
          }
      });
      
      // Add padding
      const padding = 50;
      minX -= padding; minY -= padding; maxX += padding; maxY += padding;
      const width = maxX - minX;
      const height = maxY - minY;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return exportCanvas;

      // Fill Background
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, width, height);

      // Translate to bring elements into view
      ctx.translate(-minX, -minY);

      // Draw Elements
      elements.forEach(el => {
          // Draw standard shapes/paths
          drawElement(ctx, el);

          // Manually render Widgets (Approximate representation)
          if (el.type === 'widget_text') {
              const t = el as TextWidget;
              ctx.font = `${t.fontSize || 20}px sans-serif`;
              ctx.fillStyle = '#e0e0e0';
              ctx.textBaseline = 'top';
              const lines = t.content.split('\n');
              lines.forEach((line, i) => ctx.fillText(line, t.x, t.y + (i * (t.fontSize || 20) * 1.2)));
          } else if (el.type === 'widget_code') {
              const c = el as CodeElement;
              const w = 300; const h = 150; // approx
              ctx.fillStyle = '#0d1117';
              ctx.fillRect(c.x, c.y, w, h);
              ctx.strokeStyle = '#333';
              ctx.strokeRect(c.x, c.y, w, h);
              ctx.font = '14px monospace';
              ctx.fillStyle = '#c9d1d9';
              const lines = c.content.split('\n');
              lines.forEach((line, i) => ctx.fillText(line, c.x + 10, c.y + 10 + (i * 20)));
          } else if (el.type === 'widget_array') {
              const a = el as ArrayWidget;
              const cellW = 40; const cellH = 40;
              ctx.font = '16px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              a.data.forEach((val, i) => {
                  const cx = a.x + i * cellW;
                  // Index
                  ctx.fillStyle = '#3794ff';
                  ctx.fillText(i.toString(), cx + cellW/2, a.y - 10);
                  // Cell
                  ctx.fillStyle = '#000';
                  ctx.fillRect(cx, a.y, cellW, cellH);
                  ctx.strokeStyle = '#3794ff';
                  ctx.strokeRect(cx, a.y, cellW, cellH);
                  // Value
                  ctx.fillStyle = '#fff';
                  ctx.fillText(val, cx + cellW/2, a.y + cellH/2);
              });
              ctx.textAlign = 'left'; // reset
              ctx.textBaseline = 'alphabetic';
          } else if (el.type === 'widget_table') {
              const t = el as TableWidget;
              const rowH = 30; const colW = 100;
              ctx.fillStyle = '#000';
              ctx.fillRect(t.x, t.y, colW * 2, (t.data.length + 1) * rowH);
              ctx.strokeStyle = '#2ed573';
              ctx.strokeRect(t.x, t.y, colW * 2, (t.data.length + 1) * rowH);
              
              // Header
              ctx.fillStyle = 'rgba(46, 213, 115, 0.2)';
              ctx.fillRect(t.x, t.y, colW * 2, rowH);
              ctx.fillStyle = '#2ed573';
              ctx.font = 'bold 12px monospace';
              ctx.fillText("Variable", t.x + 10, t.y + 20);
              ctx.fillText("Value", t.x + colW + 10, t.y + 20);

              // Rows
              ctx.font = '12px monospace';
              t.data.forEach((row, i) => {
                  const y = t.y + (i + 1) * rowH;
                  ctx.fillStyle = '#888';
                  ctx.fillText(row.label, t.x + 10, y + 20);
                  ctx.fillStyle = '#fff';
                  ctx.fillText(row.value, t.x + colW + 10, y + 20);
                  ctx.beginPath();
                  ctx.strokeStyle = '#333';
                  ctx.moveTo(t.x, y); ctx.lineTo(t.x + colW * 2, y);
                  ctx.stroke();
              });
              // Vertical line
              ctx.beginPath();
              ctx.moveTo(t.x + colW, t.y); ctx.lineTo(t.x + colW, t.y + (t.data.length + 1) * rowH);
              ctx.stroke();
          }
      });
      
      return exportCanvas;
  };

  const handleExportImage = () => {
      const canvas = generateExportCanvas();
      const link = document.createElement('a');
      link.download = 'devboard-export.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
  };

  const handleExportPDF = () => {
      const canvas = generateExportCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height] // Custom format matching canvas size
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('devboard-export.pdf');
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            setElements(prev => prev.slice(0, -1)); // Simple undo
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elements]); 

  return (
    <div className="w-screen h-screen bg-[#121212] overflow-hidden relative touch-none">
      
      <Toolbar 
        currentTool={tool} 
        setTool={setTool} 
        undo={() => setElements(e => e.slice(0, -1))} 
        clear={() => setElements([])}
      />
      
      <PropertiesBar 
        color={color} setColor={setColor}
        strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
        zoom={camera.z} setZoom={(z) => setCamera(prev => ({...prev, z}))}
        onUndo={() => setElements(e => e.slice(0, -1))}
        onClear={() => setElements([])}
        onSave={handleSave}
        onLoad={handleLoad}
        onExportImage={handleExportImage}
        onExportPDF={handleExportPDF}
      />

      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className={`absolute inset-0 z-10 ${tool === ToolType.PAN ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      />

      {/* DOM Widget Layer */}
      <WidgetLayer 
        elements={elements} 
        camera={camera} 
        updateElement={updateElement}
        removeElement={removeElement}
      />
      
      {/* Help Hint */}
      <div className="fixed bottom-4 right-4 text-gray-600 text-xs pointer-events-none select-none z-50">
         Middle Click to Pan • Scroll to Zoom • Ctrl+Z Undo • Ctrl+S Save
      </div>
    </div>
  );
}

export default App;