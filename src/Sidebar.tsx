import React, { useState } from "react";
import { useDnD } from "./DnDContext";
import { categories, functionsData } from "./nodes";

export default function Sidebar() {
  const [, setType] = useDnD();
  const [search, setSearch] = useState("");

  // filter helper
  const matchesSearch = (label: string) =>
    label.toLowerCase().includes(search.toLowerCase());

  return (
    <aside>
      {/* 1) Search bar */}
      <input
        type="text"
        placeholder="Filter functions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="sidebar-search"
      />

      {/* 2) Scrollable, collapsible list */}
      <div className="sidebar-content">
        {categories.map((cat) => (
          <details key={cat.name} open>
            <summary className="sidebar-category">{cat.name}</summary>
            <div>
              {cat.items
                .filter((fn) => matchesSearch(fn.label))
                .map((fn) => (
                  <div
                    key={fn.id}
                    className="dndnode"
                    draggable
                    onDragStart={(event) => {
                      // store node-type in context
                      setType("function-node");
                      // carry full payload
                      event.dataTransfer.setData(
                        "application/reactflow",
                        JSON.stringify({ ...fn, type: "function-node" }),
                      );
                      event.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    {fn.label}
                  </div>
                ))}
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}
