import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export function FunctionNode({ data }: NodeProps<FunctionNode>) {
  const { label, inputs, outputs } = data;

  const rowHeight = 24;
  const headerHeight = 28;
  const nodeHeight =
    Math.max(inputs.length, outputs.length) * rowHeight + headerHeight;

  return (
    <div
      className="function-node"
      style={{
        padding: 10,
        position: "relative",
        boxSizing: "border-box",
        height: nodeHeight,
        border: "1px solid #aaa",
        borderRadius: 5,
        background: "#fff",
      }}
    >
      {/* Header Bar */}
      <div className="fn-header">{label}</div>

      {/* Sockets & Labels */}
      {inputs.map((inp, i) => {
        const y = headerHeight + i * rowHeight + rowHeight / 2;
        return (
          <React.Fragment key={inp.name}>
            <Handle
              type="target"
              position={Position.Left}
              id={inp.name}
              style={{ top: y }}
              isConnectable
            />
            <div
              className="fn-socket-label fn-socket-label--in"
              style={{ top: y }}
            >
              {inp.name}
            </div>
          </React.Fragment>
        );
      })}

      {outputs.map((out, i) => {
        const y = headerHeight + i * rowHeight + rowHeight / 2;
        return (
          <React.Fragment key={out.name}>
            <Handle
              type="source"
              position={Position.Right}
              id={out.name}
              style={{ top: y }}
              isConnectable
            />
            <div
              className="fn-socket-label fn-socket-label--out"
              style={{ top: y }}
            >
              {out.name}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
