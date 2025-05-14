// TODO: Save/Restore
// TODO: Undo/Redo
// TODO: Validation on input/output handle types
// TODO: Copy & Paste, Cut and Delete
// TODO: For each node, if there is mathematical equivalent show it
import { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  addEdge,
  getOutgoers,
  useNodesState,
  useReactFlow,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  SelectionMode,
  type OnConnect,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import Editor from "@monaco-editor/react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import "@xyflow/react/dist/style.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import MainSidebar from "./Sidebar";
import { DnDProvider, useDnD } from "./DnDContext";
import { initialNodes, nodeTypes } from "./nodes";
import { initialEdges, edgeTypes } from "./edges";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import { generatePythonCode } from "./codegen";

function Menu(code, setCode) {
  const rf = useReactFlow();
  const nodes = rf.getNodes();
  const edges = rf.getEdges();
  const [open, setOpen] = useState(false);
  // just invoke our util, catch cycles
  const handleGenerate = useCallback(() => {
    try {
      const py = generatePythonCode(nodes, edges);
      setCode(py);
    } catch (err) {
      setCode(`# ERROR: ${(err as Error).message}`);
    }
    setOpen(true);
  }, [nodes, edges]);

  return (
    <>
      <Menubar className="border-none p-4">
        <MenubarMenu>
          <MenubarTrigger>
            <span className="flex items-center">
              <File className="px-1" />
              File
            </span>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              New Tab <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <Button variant="secondary" size="sm" onClick={handleGenerate}>
          Generate Code
        </Button>
      </Menubar>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generated Python</DialogTitle>
            <DialogDescription>Copy/paste into your .py file</DialogDescription>
          </DialogHeader>
          <pre className="bg-secondary rounded p-4 overflow-auto max-h-[60vh] text-sm">
            <code>{code}</code>
          </pre>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CodeView({ code }: { code: string }) {
  const [previewOpen, setPreviewOpen] = useState(true);
  return (
    <Collapsible
      open={previewOpen}
      onOpenChange={setPreviewOpen}
      className="flex-none w-1/3 border-l bg-secondary"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <h3 className="text-sm font-medium">Live Code Preview</h3>
        <CollapsibleTrigger asChild>
          <Button size="icon" variant="ghost">
            {previewOpen ? "▸" : "▾"}
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="h-full">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          options={{
            readOnly: true,
            minimap: { enabled: false },
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}

function Flow() {
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds);

        if (changes.some((c) => c.type === "remove")) {
          setCode(generatePythonCode(newNodes, edges));
        }

        return newNodes;
      });
    },
    [edges],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);

        if (changes.some((c) => c.type === "remove")) {
          setCode(generatePythonCode(nodes, newEdges));
        }

        return newEdges;
      });
    },
    [nodes],
  );

  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { getNodes, getEdges } = useReactFlow();
  const [type] = useDnD();

  const [code, setCode] = useState<string>("");

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
        type: fn.type,
        data: { label: fn.label, inputs: fn.inputs, outputs: fn.outputs },
        position,
      };

      setNodes((nds) => nds.concat(newNode));
      setCode(generatePythonCode([...nodes, newNode], edges));
    },
    [setNodes, type, screenToFlowPosition],
  );

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };
  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((edges) => {
        const new_edges = addEdge(connection, edges);
        setCode(generatePythonCode(nodes, new_edges));
        return new_edges;
      }),
    [setEdges],
  );

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
  const [variant] = useState("dots");

  return (
    <div className="w-screen h-screen" ref={reactFlowWrapper}>
      <Menu code setCode />
      <div className="flex flex-row h-full">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          edges={edges}
          edgeTypes={edgeTypes}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          isValidConnection={isValidConnection}
          // fitView
          panOnScroll
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
          colorMode="dark"
        >
          <Background color="#ccc" variant={variant} />
          <MiniMap zoomable pannable nodeStrokeWidth={3} />
          <Controls />
        </ReactFlow>
        <CodeView code={code} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ReactFlowProvider>
        <DnDProvider>
          <SidebarProvider defaultOpen>
            <MainSidebar />
            <Flow />
          </SidebarProvider>
        </DnDProvider>
      </ReactFlowProvider>
    </ThemeProvider>
  );
}

export default App;
