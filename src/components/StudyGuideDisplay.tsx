import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StudyGuideDisplayProps {
  studyGuide: string;
  onRegenerate: () => void;
}

export function StudyGuideDisplay({ studyGuide, onRegenerate }: StudyGuideDisplayProps) {
  const handleDownload = () => {
    const blob = new Blob([studyGuide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-guide-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Your Personalized Study Guide</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button variant="default" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-primary mb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-2xl font-semibold text-foreground mb-3 mt-6">{children}</h2>,
              h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mb-2 mt-4">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4">{children}</ol>,
              li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
              p: ({ children }) => <p className="mb-4 text-foreground">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
              ),
            }}
          >
            {studyGuide}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
