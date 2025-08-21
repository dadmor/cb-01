// src/modules/flow/gridHelpers.ts

export const GRID_SIZE = 10;

export const snapToGrid = (value: number, gridSize: number = GRID_SIZE): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapPositionToGrid = (position: { x: number; y: number }): { x: number; y: number } => {
  return {
    x: snapToGrid(position.x),
    y: snapToGrid(position.y)
  };
};