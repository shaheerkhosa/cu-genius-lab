import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Documents = () => {
  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Documents</h1>
          
          <Card className="border-2 border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Coming Soon</CardTitle>
                  <CardDescription>Document management features will be available here</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This module will allow you to upload, manage, and search through your academic documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Documents;
