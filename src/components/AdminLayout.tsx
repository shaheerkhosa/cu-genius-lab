import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useUserRole } from "@/hooks/useUserRole";
import { usePortalTheme } from "@/hooks/usePortalTheme";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  usePortalTheme("admin");
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // The admin portal is hidden behind the regular login. Anyone who isn't
  // admin gets bounced back to the student home so the routes don't leak.
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 relative overflow-y-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};
