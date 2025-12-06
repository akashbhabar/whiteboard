
export type Point = { x: number; y: number };

export enum ToolType {
  SELECT = 'select',
  PAN = 'pan',
  PEN = 'pen',
  HIGHLIGHTER = 'highlighter',
  ERASER = 'eraser',
  LINE = 'line',
  RECTANGLE = 'rectangle',
  DIAMOND = 'diamond',
  ARROW = 'arrow',
  TEXT = 'text',
  CODE = 'code',
  ARRAY = 'array',
  TABLE = 'table',
  LINKED_LIST = 'linkedlist'
}

export interface Camera {
  x: number;
  y: number;
  z: number; // Zoom level
}

export type ElementType = 'path' | 'shape' | 'widget_text' | 'widget_array' | 'widget_table' | 'widget_code';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  color: string;
  width?: number; // Stroke width or box width
  height?: number;
  selected?: boolean;
  opacity?: number; // Added for highlighter
}

export interface PathElement extends BaseElement {
  type: 'path';
  points: Point[];
  strokeWidth: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'diamond' | 'arrow' | 'linkedlist';
  width: number;
  height: number;
  strokeWidth: number;
}

export interface TextWidget extends BaseElement {
  type: 'widget_text';
  content: string;
  fontSize: number;
}

export interface CodeElement extends BaseElement {
  type: 'widget_code';
  content: string;
}

export interface ArrayWidget extends BaseElement {
  type: 'widget_array';
  data: string[];
}

export interface TableWidget extends BaseElement {
  type: 'widget_table';
  data: { label: string; value: string }[];
}

export type CanvasElement = PathElement | ShapeElement | TextWidget | ArrayWidget | TableWidget | CodeElement;