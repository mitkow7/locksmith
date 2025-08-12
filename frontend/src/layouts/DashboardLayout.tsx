import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Plus, Wand2, User, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PasswordGenerator from "@/components/PasswordGenerator";
import AddPasswordDialog from "@/components/AddPasswordDialog";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function DashboardLayout() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);

  const currentUser = apiClient.getCurrentUser();

  useEffect(() => {
    document.title = "Locksmith – Dashboard";
  }, []);

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

  const getUserInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const headerClasses = useMemo(
    () =>
      "sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    []
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className={headerClasses}>
            <div className="h-14 px-4 flex items-center gap-3">
              <SidebarTrigger className="mr-1" />
              <div className="text-lg font-semibold hidden sm:block">Locksmith</div>

              <div className="flex-1 max-w-xl">
                <Input
                  placeholder="Search your vault..."
                  aria-label="Search your vault"
                  className="w-full"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="hover-scale">
                    <Plus className="h-4 w-4 mr-2" /> Add New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50">
                  <DropdownMenuItem onClick={() => setShowAddPassword(true)}>Password</DropdownMenuItem>
                  <DropdownMenuItem disabled>Card</DropdownMenuItem>
                  <DropdownMenuItem disabled>Secure Note</DropdownMenuItem>
                  <DropdownMenuItem disabled>Identity</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size={isMobile ? "icon" : "default"} className="ml-1" aria-label="Password generator" onClick={() => setShowGenerator(true)}>
                <Wand2 className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Generate</span>}
              </Button>

              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {getUserInitials(currentUser)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {currentUser?.first_name && currentUser?.last_name 
                          ? `${currentUser.first_name} ${currentUser.last_name}`
                          : currentUser?.email || "User"
                        }
                      </span>
                      {currentUser?.email && (
                        <span className="text-xs text-muted-foreground">
                          {currentUser.email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>

      <PasswordGenerator open={showGenerator} onOpenChange={setShowGenerator} />
      <AddPasswordDialog open={showAddPassword} onOpenChange={setShowAddPassword} />
    </SidebarProvider>
  );
}
