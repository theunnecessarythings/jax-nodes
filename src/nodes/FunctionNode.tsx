import React from "react";
import { Position, NodeProps } from "@xyflow/react";
import { BaseNode } from "@/components/base-node";
import { LabeledHandle } from "@/components/labeled-handle";
import {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderActions,
  NodeHeaderMenuAction,
  NodeHeaderDeleteAction,
  NodeHeaderIcon,
} from "@/components/node-header";
import { Rocket } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function FunctionNode({ data }: NodeProps<FunctionNode>) {
  const { label, inputs, outputs } = data;

  return (
    <BaseNode className="p-0 text-sm leading-snug">
      <NodeHeader className="p-3 border-b-2">
        <NodeHeaderIcon>
          <Rocket />
        </NodeHeaderIcon>
        <NodeHeaderTitle>{label}</NodeHeaderTitle>
        <NodeHeaderActions>
          <NodeHeaderMenuAction label="Open node menu">
            <DropdownMenuItem>Reset</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </NodeHeaderMenuAction>
          <NodeHeaderDeleteAction />
        </NodeHeaderActions>
      </NodeHeader>

      <footer className="bg-black-100">
        {inputs.map((inp) => {
          return (
            <LabeledHandle
              className="inputhandle my-2"
              key={inp.name}
              type="target"
              title={inp.name}
              position={Position.Left}
              id={inp.name}
              isConnectable
            />
          );
        })}

        <footer className="flex flex-col border-t-2  ml-auto items-end bg-accent/60 rounded-bl-sm rounded-br-sm">
          {outputs.map((out) => {
            return (
              <LabeledHandle
                className="outputhandle my-2"
                key={out.name}
                type="source"
                position={Position.Right}
                id={out.name}
                title={out.name}
                isConnectable
              />
            );
          })}
        </footer>
      </footer>
    </BaseNode>
  );
}
