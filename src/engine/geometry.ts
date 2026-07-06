import { DIRECTIONS } from "../domain/rules";
import type { Direction, Position } from "../domain/types";

export const samePosition = (a: Position, b: Position) => a.x === b.x && a.y === b.y;
export const inBounds = (p: Position, size: number) => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size;
export function addDirection(p: Position, direction: Direction, steps = 1): Position {
  const [dx, dy] = DIRECTIONS[direction];
  return { x: p.x + dx * steps, y: p.y + dy * steps };
}
export function lineHits(start: Position, direction: Direction, target: Position, range: number): boolean {
  for (let step = 1; step <= range; step += 1) if (samePosition(addDirection(start, direction, step), target)) return true;
  return false;
}
