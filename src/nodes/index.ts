import type { NodeTypes } from "@xyflow/react";

import { FunctionNode } from "./FunctionNode";

import data from "./jax_api.json" assert { type: "json" };
export const functionsData = data;

// Get unique categories from functionsData
const uniqueCategories = [
  ...new Set(
    data.map((func) => {
      if (func.category === "other") return func.subcategory;
      return func.category;
    }),
  ),
];

export const categories = uniqueCategories.map((cat) => ({
  name: cat,
  items: data.filter((func) => {
    if (func.category === "other") return func.subcategory === cat;
    return func.category === cat;
  }),
}));

// export const categories: { name: string; items: FunctionData[] }[] = [
//   // { name: 'jnp', items: functionsData.filter(/*…*/) },
//   { name: "jnp", items: functionsData },
// ];

export const initialNodes = functionsData.slice(0, 2).map((func, index) => ({
  id: func.id,
  type: "function-node",
  position: { x: index * 200, y: 100 },
  data: {
    label: func.label,
    inputs: func.inputs,
    outputs: func.outputs,
  },
}));

export const nodeTypes = {
  "function-node": FunctionNode,
} satisfies NodeTypes;
