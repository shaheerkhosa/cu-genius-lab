import { MessageCircle, PieChart, FileText, BookOpen, TrendingUp, LogOut, Shield } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { title: "Chat", url: "/chat", icon: MessageCircle },
  { title: "Estimator", url: "/estimator", icon: PieChart },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Study", url: "/study", icon: BookOpen },
  { title: "Progress", url: "/progress", icon: TrendingUp },
];

const adminMenuItems = [
  { title: "Admin Queue", url: "/admin/documents", icon: Shield, adminOnly: true },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { open } = useSidebar();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-background/30 backdrop-blur-xl" collapsible="icon">
      <SidebarContent className="pt-16">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={{
                      children: item.title,
                      hidden: open,
                    }}
                    className="h-12"
                  >
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center ${open ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-xl transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary border-2 border-primary/20 font-semibold"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-2 border-transparent"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {open && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Admin-only menu items */}
              {isAdmin && (
                <>
                  <Separator className="my-3" />
                  {adminMenuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        tooltip={{
                          children: item.title,
                          hidden: open,
                        }}
                        className="h-12"
                      >
                        <NavLink
                          to={item.url}
                          className={({ isActive }) =>
                            `flex items-center ${open ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-xl transition-all ${
                              isActive
                                ? "bg-primary/10 text-primary border-2 border-primary/20 font-semibold"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50 border-2 border-transparent"
                            }`
                          }
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          {open && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button
          onClick={handleLogout}
          variant="outline"
          className={`w-full rounded-xl bg-primary/10 hover:bg-primary/20 border-2 border-primary/20 text-primary backdrop-blur-sm h-12 ${!open ? 'px-0 justify-center' : ''}`}
        >
          <LogOut className={`h-4 w-4 shrink-0 ${open ? 'mr-2' : ''}`} />
          {open && <span>Signout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
