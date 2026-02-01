"use client";

import { PlusIcon } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { NodeSelector } from "@/components/node-selector";
import { useAtom } from "jotai";
import { nodeSelectorOpenAtom } from "../store/atoms";

export const AddNodeButton = memo(()=>{
    const [selectorOpen, setSelectorOpen] = useAtom(nodeSelectorOpenAtom);
    return(
        <NodeSelector open={selectorOpen} onOpenChange={setSelectorOpen}>

        <Button 
           
            size="icon"
            variant="outline"
            className="bg-background"
        >
            <PlusIcon className="size-4" />
        </Button>
        </NodeSelector>
    )
})

AddNodeButton.displayName = "AddNodeButton";