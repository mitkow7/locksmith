import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Vault,
  Star,
  LogIn,
  CreditCard,
  StickyNote,
  IdCard,
  Clock,
  Trash2,
  Shield,
  Settings,
  LogOut,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Edit,
  Trash,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useVault } from "@/context/VaultContext";
import FolderDialog from "./FolderDialog";
import type { VaultFolder } from "@/context/VaultContext";

const items = [
  { title: "All Items", url: "/dashboard", Icon: Vault },
  { title: "Favorites", url: "/dashboard/favorites", Icon: Star },
  { title: "Login Credentials", url: "/dashboard/category/login", Icon: LogIn },
  { title: "Credit Cards", url: "/dashboard/category/card", Icon: CreditCard },
  { title: "Secure Notes", url: "/dashboard/category/note", Icon: StickyNote },
  { title: "Identity Documents", url: "/dashboard/category/identity", Icon: IdCard },
  { title: "Recently Used", url: "/dashboard/recent", Icon: Clock },
  { title: "Trash", url: "/dashboard/trash", Icon: Trash2 },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { items: vaultItems, folders, removeFolder } = useVault();
  const navigate = useNavigate();
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<VaultFolder | null>(null);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
      : "hover:bg-sidebar-accent/70 text-sidebar-foreground/90";

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error during logout");
      console.error("Logout error:", error);
    }
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowFolderDialog(true);
  };

  const handleEditFolder = (folder: VaultFolder) => {
    setEditingFolder(folder);
    setShowFolderDialog(true);
  };

  const handleDeleteFolder = (folder: VaultFolder) => {
    if (confirm(`Are you sure you want to delete the "${folder.name}" folder? Items in this folder will be moved to "No Folder".`)) {
      removeFolder(folder.id);
      toast.success("Folder deleted successfully");
    }
  };

  const getFolderItemCount = (folderName: string) => {
    return vaultItems.filter(item => item.folder === folderName).length;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">Vault</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ title, url, Icon }) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={url} end className={getNavCls}>
                      <Icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{title}</span>}
                      {title === "All Items" && !collapsed && (
                        <Badge variant="secondary" className="ml-auto">
                          {vaultItems.length}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="text-sidebar-foreground">Folders</SidebarGroupLabel>
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateFolder}
                className="h-6 w-6 p-0 hover:bg-sidebar-accent"
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            )}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <div className="flex items-center group">
                    <SidebarMenuButton asChild className="flex-1">
                      <NavLink to={`/dashboard/folder/${encodeURIComponent(folder.name)}`} className={getNavCls}>
                        <Folder className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{folder.name}</span>
                            <Badge variant="secondary" className="ml-auto">
                              {getFolderItemCount(folder.name)}
                            </Badge>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteFolder(folder)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/security" className={getNavCls}>
                    <Shield className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Security</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/settings" className={getNavCls}>
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground/90 hover:bg-sidebar-accent/70 h-auto p-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Logout</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <FolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        folder={editingFolder}
      />
    </Sidebar>
  );
}
