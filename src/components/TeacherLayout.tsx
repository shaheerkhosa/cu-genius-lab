import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/TeacherSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface TeacherLayoutProps {
  children: ReactNode;
}

export const TeacherLayout = ({ children }: TeacherLayoutProps) => {
  return (
    <ProtectedRoute>
      <div className="teacher-portal">
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <TeacherSidebar />
            <main className="flex-1 relative overflow-y-auto">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
};
