import { useEffect, useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DocumentVerificationResult } from './DocumentVerificationResult';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  verification_status: string;
  verification_score: number | null;
  verification_details: any;
  created_at: string;
}

interface DocumentHistoryProps {
  refreshTrigger: number;
}

export function DocumentHistory({ refreshTrigger }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: 'default',
      flagged: 'secondary',
      rejected: 'destructive',
      pending: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 rounded-lg">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{doc.file_name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    {getStatusBadge(doc.verification_status)}
                    {doc.verification_score !== null && (
                      <span className="text-xs font-semibold text-primary">
                        {doc.verification_score}/100
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDoc && (
            <DocumentVerificationResult
              status={selectedDoc.verification_status}
              score={selectedDoc.verification_score || 0}
              details={selectedDoc.verification_details}
              fileName={selectedDoc.file_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
