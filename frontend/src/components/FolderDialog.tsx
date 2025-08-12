import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/context/VaultContext";
import { toast } from "@/hooks/use-toast";

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: { id: string; name: string } | null;
}

export default function FolderDialog({ open, onOpenChange, folder }: FolderDialogProps) {
  const [name, setName] = useState("");
  const { addFolder, updateFolder, folders } = useVault();

  useEffect(() => {
    if (folder) {
      setName(folder.name);
    } else {
      setName("");
    }
  }, [folder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ title: "Folder name is required", variant: "destructive" });
      return;
    }

    // Check for duplicate names
    const existingFolder = folders.find(f => f.name.toLowerCase() === name.trim().toLowerCase() && f.id !== folder?.id);
    if (existingFolder) {
      toast({ title: "A folder with this name already exists", variant: "destructive" });
      return;
    }

    if (folder) {
      updateFolder(folder.id, { name: name.trim() });
      toast({ title: "Folder updated successfully" });
    } else {
      addFolder({ name: name.trim() });
      toast({ title: "Folder created successfully" });
    }
    
    onOpenChange(false);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{folder ? "Edit Folder" : "Create New Folder"}</DialogTitle>
          <DialogDescription>
            {folder ? "Update the folder name." : "Create a new folder to organize your vault items."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Enter folder name..."
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {folder ? "Update" : "Create"} Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
