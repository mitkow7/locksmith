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
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { useVault } from "@/context/VaultContext";

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
  const { items: vaultItems } = useVault();
  const navigate = useNavigate();

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
    </Sidebar>
  );
}
