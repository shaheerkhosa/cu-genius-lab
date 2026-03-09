import { TeacherLayout } from "@/components/TeacherLayout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Construction } from "lucide-react";

interface TeacherPlaceholderProps {
  title: string;
}

const TeacherPlaceholder = ({ title }: TeacherPlaceholderProps) => {
  return (
    <TeacherLayout>
      <DecorativeBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <Construction className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-3xl font-bold text-primary">{title}</h1>
        <p className="text-muted-foreground mt-2">This feature is coming soon.</p>
      </div>
    </TeacherLayout>
  );
};

export default TeacherPlaceholder;
