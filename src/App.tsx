// TODO: Save/Restore
// TODO: Undo/Redo
// TODO: Validation on input/output handle types
// TODO: Copy & Paste, Cut and Delete

import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Panel,
  addEdge,
  getOutgoers,
  useNodesState,
  useReactFlow,
  useEdgesState,
  SelectionMode,
  type OnConnect,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import Sidebar from "./Sidebar";
import { DnDProvider, useDnD } from "./DnDContext";
import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { getNodes, getEdges } = useReactFlow();
  const [type] = useDnD();

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const dataStr = event.dataTransfer.getData("application/reactflow");
      if (!dataStr || !type) return;

      const fn = JSON.parse(dataStr);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${fn.id}_${Date.now()}`,
        type: fn.type, // 'functionNode'
        data: { label: fn.label, inputs: fn.inputs, outputs: fn.outputs },
        position,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, type, screenToFlowPosition],
  );

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges],
  );

  const nodeColor = (node) => {
    switch (node.type) {
      case "input":
        return "#6ede87";
      case "output":
        return "#6865A5";
      default:
        return "#ff0072";
    }
  };

  const isValidConnection = useCallback(
    (connection) => {
      // we are using getNodes and getEdges helpers here
      // to make sure we create isValidConnection function only once
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target);
      const hasCycle = (node, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (target.id === connection.source) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges],
  );

  const [variant, setVariant] = useState("dots");
  return (
    <div className="dndflow">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          edges={edges}
          edgeTypes={edgeTypes}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          isValidConnection={isValidConnection}
          fitView
          panOnScroll
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
          colorMode="dark"
        >
          <Background color="#ccc" variant={variant} />
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
          />
          <Controls />
          <Panel>
            <div>Variant</div>
            <button onClick={() => setVariant("dots")}>dots</button>
            <button onClick={() => setVariant("lines")}>lines</button>
            <button onClick={() => setVariant("cross")}>cross</button>
          </Panel>
        </ReactFlow>
      </div>
      <Sidebar />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <Flow />
      </DnDProvider>
    </ReactFlowProvider>
  );
}

export default App;
