import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VaultItem, VaultItemType } from "@/data/mockVault";
import { useVault } from "@/context/VaultContext";
import { Eye, EyeOff, Star, Wand2, X, Plus, Shield, Folder, FolderOpen } from "lucide-react";
import { PasswordStrengthBar } from "@/components/PasswordStrengthBar";
import { toast } from "sonner";

interface EditPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: VaultItem | null;
}

export default function EditPasswordDialog({ open, onOpenChange, item }: EditPasswordDialogProps) {
  const { updateItem, folders } = useVault();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState("");
  
  // Form state
  const [formData, setFormData] = useState<Partial<VaultItem>>({
    site: "",
    username: "",
    password: "",
    notes: "",
    type: "login",
    favorite: false,
    folder: "",
    tags: [],
  });

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        site: item.site || "",
        username: item.username || "",
        password: item.password || "",
        notes: item.notes || "",
        type: item.type || "login",
        favorite: item.favorite || false,
        folder: item.folder || "",
        tags: item.tags || [],
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the item
      updateItem(item.id, {
        ...formData,
        // Recalculate password strength based on new password
        strength: calculatePasswordStrength(formData.password || ""),
      });
      
      toast.success("Item updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update item");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): VaultItem["strength"] => {
    if (!password) return "weak";
    if (password.length < 8) return "weak";
    if (password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return "strong";
    }
    return "weak";
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  if (!item) {
    return null;
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit {item.type === "login" ? "Password" : item.type === "note" ? "Secure Note" : "Item"}
            {formData.favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
          </DialogTitle>
          <DialogDescription>
            Update your {item.type} details and security settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site">
                  {item.type === "login" ? "Website or App" : "Title"}
                </Label>
                <Input
                  id="site"
                  value={formData.site}
                  onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                  placeholder={item.type === "login" ? "https://example.com" : "Note title"}
                />
              </div>

              {item.type === "login" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username or Email</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="username@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        className="pr-20"
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generatePassword}
                          className="h-8 w-8 p-0"
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-8 w-8 p-0"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {formData.password && (
                      <PasswordStrengthBar password={formData.password} />
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or information..."
                  rows={3}
                />
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
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {formData.tags.map((tag) => (
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
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                <select 
                  id="folder"
                  value={formData.folder || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value || undefined }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">No folder</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.name}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground">
                  Organize your vault items into folders for better management
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Mark as Favorite</Label>
                  <p className="text-sm text-muted-foreground">Quick access from favorites</p>
                </div>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, favorite: !prev.favorite }))}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${
                    formData.favorite 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {formData.favorite && <Star className="w-4 h-4 mr-2 fill-current" />}
                  {formData.favorite ? 'Favorited' : 'Add to Favorites'}
                </button>
              </div>
              
              {formData.password && (
                <>
                  <div className="space-y-2">
                    <Label>Password Strength</Label>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          calculatePasswordStrength(formData.password || "") === "strong" ? "default" :
                          calculatePasswordStrength(formData.password || "") === "weak" ? "secondary" : "destructive"
                        }
                      >
                        {calculatePasswordStrength(formData.password || "")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {(formData.password || "").length} characters
                      </span>
                    </div>
                  </div>
                  
                  {calculatePasswordStrength(formData.password || "") !== "strong" && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium">Security Recommendation</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Consider using a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and special characters.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>


        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
