import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gsap } from 'gsap';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface StudyGuideDisplayProps {
  studyGuide: string;
  onRegenerate: () => void;
}

export function StudyGuideDisplay({ studyGuide, onRegenerate }: StudyGuideDisplayProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 40,
        scale: 0.98,
        duration: 0.8,
        ease: 'power3.out',
      });
    }
  }, [studyGuide]);

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
    toast({
      title: 'Downloaded',
      description: 'Study guide saved as markdown file',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(studyGuide);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'Study guide copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card ref={cardRef} className="border-2 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-2xl">Your Personalized Study Guide</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
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
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="text-3xl font-bold text-primary mb-4 pb-2 border-b border-border/60">{children}</h1>,
              h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 tracking-tight">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2 mt-4 uppercase tracking-wide text-muted-foreground">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 mb-4 marker:text-muted-foreground">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 mb-4 marker:text-muted-foreground">{children}</ol>,
              li: ({ children }) => <li className="text-foreground/90 leading-relaxed">{children}</li>,
              p: ({ children }) => <p className="mb-4 text-foreground leading-relaxed">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
              ),
              hr: () => <hr className="my-6 border-border/60" />,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary/40 pl-4 py-1 my-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm border-collapse">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted/50 border-b border-border/60">{children}</thead>
              ),
              tbody: ({ children }) => <tbody className="divide-y divide-border/40">{children}</tbody>,
              tr: ({ children }) => <tr>{children}</tr>,
              th: ({ children }) => (
                <th className="text-left font-semibold px-4 py-2.5 text-foreground">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2.5 align-top text-foreground/90">{children}</td>
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
