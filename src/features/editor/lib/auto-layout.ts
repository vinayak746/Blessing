import type { Edge, Node } from "@xyflow/react";

/**
 * Spacing used by "Tidy up" and by new-node placement.
 *
 * A node is ~40px wide but its label card below it is up to 180px wide and
 * ~60px tall, so what really needs room is the *footprint*, not the icon.
 * Columns are 240px apart (label width + gap) and rows 140px apart (icon +
 * label + gap), which keeps neighbouring labels and edges from colliding.
 */
export const LAYOUT = {
  columnGap: 240,
  rowGap: 140,
  grid: 10,
} as const;

type XY = { x: number; y: number };

const snap = (value: number) => Math.round(value / LAYOUT.grid) * LAYOUT.grid;

/** Handles in the order they should appear top-to-bottom: True above False. */
const handleRank = (handle: string | null | undefined): number => {
  if (handle === "true") return 0;
  if (handle === "false") return 1;
  return 2;
};

const compareHandles = (a: string, b: string): number =>
  handleRank(a) - handleRank(b) || a.localeCompare(b);

/**
 * Computes tidy positions for a left-to-right layered layout:
 *  - a node sits one column to the right of its furthest parent,
 *  - children of a branching node (IF / Else) are fanned out around it with
 *    True above False,
 *  - a node fed by several parents is centred between them (so the merge
 *    after an IF lines up),
 *  - nothing closer than one row to its neighbour in the same column,
 *  - the result is anchored where the user's graph already is, snapped to
 *    the 10px grid, and is stable (running it twice changes nothing).
 * Cycles and dangling edges are tolerated; disconnected nodes become their
 * own rows.
 */
export const computeLayout = (
  nodes: Node[],
  edges: Edge[],
): Map<string, XY> => {
  const result = new Map<string, XY>();
  if (nodes.length === 0) return result;

  const index = new Map(nodes.map((node, i) => [node.id, i]));

  // Clean edge list: both ends exist, no self-loops, no duplicates.
  const seen = new Set<string>();
  const cleanEdges = edges.filter((edge) => {
    if (edge.source === edge.target) return false;
    if (!index.has(edge.source) || !index.has(edge.target)) return false;
    const key = `${edge.source}|${edge.sourceHandle ?? ""}|${edge.target}|${edge.targetHandle ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const incoming = new Map<string, Edge[]>();
  const outgoing = new Map<string, Edge[]>();
  for (const node of nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }
  for (const edge of cleanEdges) {
    incoming.get(edge.target)!.push(edge);
    outgoing.get(edge.source)!.push(edge);
  }

  // ---- 1. Columns: longest path from a source (Kahn; tolerant of cycles) ----
  const layer = new Map<string, number>();
  const remaining = new Map(
    nodes.map((n) => [n.id, incoming.get(n.id)!.length]),
  );
  const queue = nodes.filter((n) => remaining.get(n.id) === 0).map((n) => n.id);
  for (const id of queue) layer.set(id, 0);

  for (let head = 0; head < queue.length; head++) {
    const id = queue[head];
    for (const edge of outgoing.get(id)!) {
      layer.set(
        edge.target,
        Math.max(layer.get(edge.target) ?? 0, layer.get(id)! + 1),
      );
      const left = remaining.get(edge.target)! - 1;
      remaining.set(edge.target, left);
      if (left === 0) queue.push(edge.target);
    }
  }
  // Anything still unplaced is part of a cycle: put it after its placed parents.
  for (const node of nodes) {
    if (layer.has(node.id)) continue;
    const parents = incoming
      .get(node.id)!
      .map((e) => layer.get(e.source))
      .filter((v): v is number => v !== undefined);
    layer.set(node.id, parents.length ? Math.max(...parents) + 1 : 0);
  }

  const layers: string[][] = [];
  for (const node of nodes) {
    const l = layer.get(node.id)!;
    (layers[l] ??= []).push(node.id);
  }

  // ---- 2. Rows ----
  const anchorX = Math.min(...nodes.map((n) => n.position.x));
  const anchorY = Math.min(...nodes.map((n) => n.position.y));
  const y = new Map<string, number>();
  const currentY = (id: string) => nodes[index.get(id)!].position.y;
  const currentX = (id: string) => nodes[index.get(id)!].position.x;

  // Column 0 keeps the user's top-to-bottom order.
  const first = [...(layers[0] ?? [])].sort(
    (a, b) =>
      currentY(a) - currentY(b) ||
      currentX(a) - currentX(b) ||
      index.get(a)! - index.get(b)!,
  );
  first.forEach((id, i) => y.set(id, anchorY + i * LAYOUT.rowGap));

  for (let l = 1; l < layers.length; l++) {
    const wanted = (layers[l] ?? []).map((id) => {
      const offsets = incoming.get(id)!.map((edge) => {
        const parentY = y.get(edge.source) ?? anchorY;
        const siblings = [
          ...new Set(
            outgoing.get(edge.source)!.map((e) => e.sourceHandle ?? ""),
          ),
        ].sort(compareHandles);
        // Fan branches out around the parent: with 2 outputs, one half a row
        // above and one half a row below.
        const slot = siblings.indexOf(edge.sourceHandle ?? "");
        const spread =
          siblings.length > 1
            ? (slot - (siblings.length - 1) / 2) * LAYOUT.rowGap
            : 0;
        return parentY + spread;
      });
      const preferred = offsets.length
        ? offsets.reduce((a, b) => a + b, 0) / offsets.length
        : anchorY;
      return { id, preferred };
    });

    wanted.sort(
      (a, b) =>
        a.preferred - b.preferred ||
        currentY(a.id) - currentY(b.id) ||
        index.get(a.id)! - index.get(b.id)!,
    );

    let previous = -Infinity;
    for (const item of wanted) {
      const placed = Math.max(item.preferred, previous + LAYOUT.rowGap);
      y.set(item.id, placed);
      previous = placed;
    }
  }

  // ---- 3. Anchor to the user's top-left and snap to the grid ----
  const minY = Math.min(...[...y.values()]);
  for (const node of nodes) {
    result.set(node.id, {
      x: snap(anchorX + layer.get(node.id)! * LAYOUT.columnGap),
      y: snap(anchorY + (y.get(node.id)! - minY)),
    });
  }
  return result;
};

/** Returns the nodes with tidy positions applied (other fields untouched). */
export const applyLayout = (nodes: Node[], edges: Edge[]): Node[] => {
  const positions = computeLayout(nodes, edges);
  return nodes.map((node) => {
    const next = positions.get(node.id);
    return next ? { ...node, position: next } : node;
  });
};

/**
 * Picks a spot for a newly added node: `preferred` if it is free, otherwise
 * the first free spot below it. "Free" means no existing node's footprint
 * (icon + label card) would overlap.
 */
export const findFreePosition = (existing: Node[], preferred: XY): XY => {
  const overlaps = (p: XY) =>
    existing.some(
      (node) =>
        Math.abs(node.position.x - p.x) < LAYOUT.columnGap * 0.9 &&
        Math.abs(node.position.y - p.y) < LAYOUT.rowGap * 0.9,
    );

  let candidate = { x: snap(preferred.x), y: snap(preferred.y) };
  for (let attempt = 0; attempt < 200 && overlaps(candidate); attempt++) {
    candidate = { x: candidate.x, y: candidate.y + LAYOUT.rowGap };
  }
  return candidate;
};
