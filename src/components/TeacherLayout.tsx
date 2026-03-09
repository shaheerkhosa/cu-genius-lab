import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePortalTheme } from "@/hooks/usePortalTheme";

interface TeacherLayoutProps {
  children: ReactNode;
}

export const TeacherLayout = ({ children }: TeacherLayoutProps) => {
  usePortalTheme("teacher");

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <TeacherSidebar />
          <main className="flex-1 relative overflow-y-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};
