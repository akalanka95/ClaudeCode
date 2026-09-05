import { useState } from "react";
import { CollapsibleSidePanel } from "../common/CollapsibleSidePanel";
import { SyncPanel } from "./SyncPanel";
import { ReferenceMaterialsPanel } from "./ReferenceMaterialsPanel";

interface SyncReferenceSidebarProps {
  nodeId: string;
}

export function SyncReferenceSidebar({ nodeId }: SyncReferenceSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <CollapsibleSidePanel label="Sync & reference materials" open={open} onOpenChange={setOpen}>
      <SyncPanel nodeId={nodeId} />
      <ReferenceMaterialsPanel nodeId={nodeId} />
    </CollapsibleSidePanel>
  );
}
