import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getFaviconUrl, type VaultItem } from "@/data/mockVault";
import { useVault } from "@/context/VaultContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Grid2X2, List, Star, Copy, Shield, Globe, Edit, Tag, X, MoreVertical, FolderOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import EditPasswordDialog from "@/components/EditPasswordDialog";

export default function VaultPage() {
  const { items: all, folders, updateItem } = useVault();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"name" | "modified">("modified");
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const location = useLocation();
  const { cat, folderName } = useParams();

  useEffect(() => {
    // reset search on route change
    setQuery("");
    setSelectedTags([]);
  }, [location.pathname]);

  // Get all available tags from items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    all.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [all]);

  const items = useMemo(() => {
    let filtered = all;
    if (location.pathname.endsWith("/favorites")) filtered = filtered.filter((i) => i.favorite);
    if (location.pathname.includes("/category/") && cat) filtered = filtered.filter((i) => i.type === cat);
    if (location.pathname.includes("/folder/") && folderName) {
      const decodedFolderName = decodeURIComponent(folderName);
      filtered = filtered.filter((i) => i.folder === decodedFolderName);
    }
    if (location.pathname.endsWith("/trash")) filtered = filtered.filter(() => false);

    // Filter by search query
    filtered = filtered.filter((i) => (i.site + (i.username ?? "")).toLowerCase().includes(query.toLowerCase()));

    // Filter by selected tags - item must have ALL selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((i) => 
        selectedTags.every(tag => i.tags?.includes(tag))
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (sort === "name") return a.site.localeCompare(b.site);
      return new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
    });
    return filtered;
  }, [all, query, sort, location.pathname, cat, folderName, selectedTags]);

  const copyPassword = (item: VaultItem) => {
    if (!item.password) return;
    navigator.clipboard.writeText(item.password);
    toast({ title: "Password copied to clipboard" });
  };

  const editItem = (item: VaultItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const moveToFolder = (item: VaultItem, folderName: string) => {
    updateItem(item.id, { folder: folderName || undefined });
    toast({ 
      title: folderName 
        ? `Moved "${item.site}" to "${folderName}" folder` 
        : `Moved "${item.site}" to "No Folder"`
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const statusColor = (s: VaultItem["strength"]) =>
    s === "strong" ? "text-success" : s === "weak" ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant={view === "grid" ? "default" : "outline"} onClick={() => setView("grid")} aria-pressed={view === "grid"}>
            <Grid2X2 className="h-4 w-4 mr-2" /> Grid
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} aria-pressed={view === "list"}>
            <List className="h-4 w-4 mr-2" /> List
          </Button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Input placeholder="Filter..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-60" />
          <select
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-10 rounded-md border bg-background px-3"
          >
            <option value="modified">Date Modified</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Tag filtering section */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by tags:</span>
            {selectedTags.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllTags}>
                <X className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle>No items found</CardTitle>
          <p className="text-muted-foreground">Try a different search or create a new item.</p>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover-scale">
              <CardHeader className="flex-row items-center gap-3">
                <img
                  src={item.type === "login" ? getFaviconUrl(item.site) : "/placeholder.svg"}
                  alt="site icon"
                  className="h-6 w-6 rounded"
                />
                <CardTitle className="flex-1 truncate text-base">{item.site}</CardTitle>
                {item.favorite && <Star className="h-4 w-4 text-warning" />}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Move to Folder</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => moveToFolder(item, "")}
                      className={!item.folder ? "bg-accent" : ""}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      No Folder
                    </DropdownMenuItem>
                    {folders.map((folder) => (
                      <DropdownMenuItem 
                        key={folder.id}
                        onClick={() => moveToFolder(item, folder.name)}
                        className={item.folder === folder.name ? "bg-accent" : ""}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editItem(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.username || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Edited {new Date(item.modifiedAt).toLocaleDateString()}</span>
                    {item.folder && (
                      <Badge variant="outline" className="text-xs">
                        <FolderOpen className="mr-1 h-3 w-3" />
                        {item.folder}
                      </Badge>
                    )}
                  </div>
                  <span className={statusColor(item.strength)}>
                    <Shield className="inline h-3 w-3 mr-1" /> {item.strength}
                  </span>
                </div>
                {item.password && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => copyPassword(item)}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => editItem(item)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </div>
                )}
                {item.tags && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {item.tags.map((t) => (
                      <Badge key={t} variant="outline">{t}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <img
                src={item.type === "login" ? getFaviconUrl(item.site) : "/placeholder.svg"}
                alt="site icon"
                className="h-6 w-6 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.site}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{item.username || "—"}</span>
                  {item.folder && (
                    <Badge variant="outline" className="text-xs">
                      <FolderOpen className="mr-1 h-3 w-3" />
                      {item.folder}
                    </Badge>
                  )}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground hidden md:block">{new Date(item.modifiedAt).toLocaleDateString()}</div>
              <div className={"text-xs " + statusColor(item.strength)}>
                <Shield className="inline h-3 w-3 mr-1" /> {item.strength}
              </div>
              {item.password && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => copyPassword(item)}>
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => editItem(item)}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Move to Folder</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => moveToFolder(item, "")}
                        className={!item.folder ? "bg-accent" : ""}
                      >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        No Folder
                      </DropdownMenuItem>
                      {folders.map((folder) => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => moveToFolder(item, folder.name)}
                          className={item.folder === folder.name ? "bg-accent" : ""}
                        >
                          <FolderOpen className="mr-2 h-4 w-4" />
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <EditPasswordDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        item={editingItem}
      />
    </div>
  );
}
