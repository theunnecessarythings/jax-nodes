import type { Node, BuiltInNode } from "@xyflow/react";

export type FunctionNode = Node<{ label: string }, "function">;
export type AppNode = BuiltInNode | FunctionNode;
