import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVault } from "@/context/VaultContext";
import PasswordGenerator from "./PasswordGenerator";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { toast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddPasswordDialog({ open, onOpenChange }: Props) {
  const { addItem, folders } = useVault();
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setSite("");
      setUsername("");
      setPassword("");
      setFavorite(false);
      setTags([]);
      setNewTag("");
      setSelectedFolder("");
    }
  }, [open]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const onSave = () => {
    if (!site || !password) return;
    addItem({
      id: String(Date.now()),
      type: "login",
      site,
      username,
      password,
      notes: "",
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      strength: password.length >= 12 ? "strong" : password.length >= 8 ? "weak" : "compromised",
      favorite,
      folder: selectedFolder || undefined,
      tags,
    });
    toast({ title: "Item saved" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site">Website URL or Name</Label>
            <Input id="site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user">Username / Email</Label>
            <Input id="user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Password</Label>
            <div className="flex gap-2">
              <Input id="pw" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button variant="secondary" onClick={() => setShowGenerator(true)}>Generate</Button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger>
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.name}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="fav" checked={favorite} onCheckedChange={(v) => setFavorite(Boolean(v))} />
            <Label htmlFor="fav">Favorite</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave} disabled={!site || !password}>Save</Button>
        </DialogFooter>
      </DialogContent>

      <PasswordGenerator
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onUsePassword={(pw) => setPassword(pw)}
      />
    </Dialog>
  );
}
