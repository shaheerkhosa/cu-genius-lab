import { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, RotateCcw, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DocumentReviewModal } from './DocumentReviewModal';
import { toast } from '@/hooks/use-toast';

interface Document {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  verification_status: string;
  verification_score: number | null;
  verification_details: any;
  flagged_reason: string | null;
  created_at: string;
  admin_notes: string | null;
}

interface AdminDocumentQueueProps {
  statusFilter: 'flagged' | 'pending' | 'verified' | 'rejected' | 'all';
}

export function AdminDocumentQueue({ statusFilter }: AdminDocumentQueueProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (docId: string, action: 'approve' | 'reject' | 'request_reupload', notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const statusMap = {
        approve: 'verified',
        reject: 'rejected',
        request_reupload: 'pending',
      };

      const { error } = await supabase
        .from('documents')
        .update({
          verification_status: statusMap[action],
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes,
        })
        .eq('id', docId);

      if (error) throw error;

      // Create notification
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        await supabase.from('notifications').insert({
          user_id: doc.user_id,
          type: `document_${action}d`,
          title: `Document ${action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Reupload Requested'}`,
          message: notes || `Your document "${doc.file_name}" has been ${action}d by an admin.`,
          document_id: docId,
        });
      }

      toast({
        title: 'Success',
        description: `Document ${action}d successfully`,
      });

      fetchDocuments();
      setSelectedDoc(null);
    } catch (error) {
      console.error('Action error:', error);
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive',
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: string, score: number | null) => {
    const variants: Record<string, any> = {
      verified: 'default',
      flagged: 'secondary',
      rejected: 'destructive',
      pending: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
        {score !== null && ` (${score}/100)`}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading documents...</div>;
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="matric_certificate">Matric</SelectItem>
            <SelectItem value="olevel_result">O-Level</SelectItem>
            <SelectItem value="alevel_result">A-Level</SelectItem>
            <SelectItem value="health_certificate">Health</SelectItem>
            <SelectItem value="character_certificate">Character</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center p-8 bg-muted/30 rounded-lg">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No documents found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{doc.file_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      {getStatusBadge(doc.verification_status, doc.verification_score)}
                    </div>

                    {doc.flagged_reason && (
                      <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-700 dark:text-yellow-300">
                        ⚠️ {doc.flagged_reason}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mb-3">
                      Uploaded {new Date(doc.created_at).toLocaleString()}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        View Details
                      </Button>

                      {(doc.verification_status === 'flagged' || doc.verification_status === 'pending') && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAction(doc.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleAction(doc.id, 'reject', 'Document does not meet requirements')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAction(doc.id, 'request_reupload', 'Please upload a clearer image')}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Request Reupload
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedDoc && (
        <DocumentReviewModal
          document={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onAction={handleAction}
        />
      )}
    </>
  );
}
