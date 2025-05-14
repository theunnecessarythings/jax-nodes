// src/utils/codegen.ts
import type { Node as RFNode, Edge as RFEdge } from "@xyflow/react";

/** Accept either an array or a `{ [id]: item }` map */
function asArray<T>(maybe: T[] | Record<string, T>): T[] {
  return Array.isArray(maybe) ? maybe : Object.values(maybe);
}

/** Turn "Dyn Argnums" → "dyn_argnums" */
function toSnake(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
}

export function topologicalSort(
  rawNodes: RFNode[] | Record<string, RFNode>,
  rawEdges: RFEdge[] | Record<string, RFEdge>,
): string[] {
  const nodes = asArray(rawNodes);
  const edges = asArray(rawEdges);

  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();

  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDeg.set(n.id, 0);
  });

  edges.forEach((e) => {
    if (!adj.has(e.source) || !inDeg.has(e.target)) {
      console.warn(`codegen: skipping edge ${e.source}→${e.target}`);
      return;
    }
    adj.get(e.source)!.push(e.target);
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
  });

  const queue = nodes.filter((n) => inDeg.get(n.id)! === 0).map((n) => n.id);
  const sorted: string[] = [];

  while (queue.length) {
    const nid = queue.shift()!;
    sorted.push(nid);
    for (const nbr of adj.get(nid)!) {
      inDeg.set(nbr, inDeg.get(nbr)! - 1);
      if (inDeg.get(nbr)! === 0) {
        queue.push(nbr);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error("Cycle detected in graph");
  }
  return sorted;
}

export function generatePythonCode(
  rawNodes: RFNode[] | Record<string, RFNode>,
  rawEdges: RFEdge[] | Record<string, RFEdge>,
): string {
  const nodes = asArray(rawNodes);
  const edges = asArray(rawEdges);
  const order = topologicalSort(nodes, edges);

  const lines = order.map((nid) => {
    const node = nodes.find((n) => n.id === nid)!;
    const fnName = node.id; // use the node's ID as the function name
    const varName = `${fnName}_out`;

    // Build keyword args only for connected inputs
    const inputs: { name: string }[] = node.data.inputs || [];
    const kwArgs = inputs.flatMap((inp) => {
      const e = edges.find(
        (ed) => ed.target === nid && ed.targetHandle === inp.name,
      );
      if (!e) return [];
      const key = toSnake(inp.name);
      return [`${key}=${e.source}_out`];
    });

    const argString = kwArgs.join(", ");
    return argString
      ? `${varName} = ${fnName}(${argString})`
      : `${varName} = ${fnName}()`;
  });
  return lines.join("\n");
}
