import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 relative overflow-y-auto">
            <div className="fixed top-16 left-3 z-50">
              <SidebarTrigger className="h-12 w-12 rounded-xl bg-card/80 backdrop-blur-sm border-2 border-border hover:bg-card shadow-lg flex items-center justify-center p-0">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
            </div>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};
