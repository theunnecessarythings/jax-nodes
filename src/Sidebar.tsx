import React, { useState, useCallback } from "react";
import { useDnD } from "./DnDContext";
import { categories } from "./nodes";
import { useReactFlow, type Node as RFNode } from "@xyflow/react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Search,
  Group,
  ChevronDown,
  GripVertical,
  Plus,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";

let id = 0;
const getId = () => `dndnode_${id++}`;

function SidebarSearch({ value, onChange }) {
  return (
    <div className="p-0 m-0">
      <div className="relative w-full">
        {/* left‑hand icon */}
        <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />

        {/* the actual input */}
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={onChange}
          className="
            w-full
            pl-10         /* give room for icon */
            pr-12         /* give room for kbd */
            py-1
            bg-muted      /* same bg as sidebar */
            text-foreground
            placeholder:text-muted-foreground
            border border-border
            rounded-sm
            focus:outline-none focus:ring-2 focus:ring-ring
          "
        />
      </div>
    </div>
  );
}

export default function MainSidebar() {
  const [, setType] = useDnD();
  const reactFlow = useReactFlow();
  const [search, setSearch] = useState("");

  // Filter helper
  const matchesSearch = (label: string) =>
    label.toLowerCase().includes(search.toLowerCase());

  const handleClickAdd = useCallback(
    (e: React.MouseEvent, fn: (typeof categories)[number]["items"][0]) => {
      e.stopPropagation();
      setType("function-node");
      // use the click position to project into the flow coords:
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: RFNode = {
        id: getId(),
        type: "function-node",
        position,
        data: { ...fn, label: fn.label },
      };
      reactFlow.setNodes((nds) => nds.concat(newNode));
    },
    [reactFlow, setType],
  );

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="w-64 flex-none bg-background border-r"
    >
      <SidebarHeader className="p-4 my-2">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold">Nodes</h1>
        </div>
        <SidebarSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SidebarHeader>

      {/* === Scrollable, Collapsible Groups === */}
      <SidebarContent className="sidebar-scroll overflow-y-auto flex-1 px-2">
        {categories.map((cat) => (
          <Collapsible
            key={cat.name}
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarGroup className="px-1 py-1">
              <SidebarGroupLabel className="px-1 py-1 font-semibold" asChild>
                <CollapsibleTrigger>
                  <Group className="mr-2" />
                  {cat.name}
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent className="">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {cat.items
                      .filter((fn) => matchesSearch(fn.label))
                      .map((fn) => (
                        <SidebarMenuItem
                          key={fn.id}
                          draggable
                          onDragStart={(e) => {
                            // tell DnDContext what type
                            setType("function-node");
                            // carry entire payload for onDrop
                            e.dataTransfer.setData(
                              "application/reactflow",
                              JSON.stringify({ ...fn, type: "function-node" }),
                            );
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          className="cursor-grab"
                        >
                          <SidebarMenuButton asChild className="py-6">
                            <div className="w-full text-left px-2 py-2 hover:bg-accent/100 bg-accent/60 rounded-sm">
                              <Workflow />
                              <span className="flex-1 truncate">
                                {fn.label}
                              </span>
                              <div className="ml-auto flex">
                                <Button
                                  className="p-4 w-4 h-4 bg-transparent border-transparent"
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => handleClickAdd(e, fn)}
                                >
                                  <Plus />
                                </Button>
                                <GripVertical className="my-2 w-4 h-4 cursor-grab text-muted-foreground" />
                              </div>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      {/* === Optional Footer === */}
      <SidebarFooter className="p-2 text-xs text-muted-foreground">
        v1.0.0
      </SidebarFooter>
    </Sidebar>
  );
}
