import { Point, Camera } from './types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const screenToWorld = (screen: Point, camera: Camera): Point => {
  return {
    x: (screen.x - camera.x) / camera.z,
    y: (screen.y - camera.y) / camera.z,
  };
};

export const worldToScreen = (world: Point, camera: Camera): Point => {
  return {
    x: world.x * camera.z + camera.x,
    y: world.y * camera.z + camera.y,
  };
};

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};
