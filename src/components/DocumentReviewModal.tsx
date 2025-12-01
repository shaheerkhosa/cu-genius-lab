import { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DocumentVerificationResult } from './DocumentVerificationResult';

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
  admin_notes: string | null;
}

interface DocumentReviewModalProps {
  document: Document;
  open: boolean;
  onClose: () => void;
  onAction: (docId: string, action: 'approve' | 'reject' | 'request_reupload', notes?: string) => void;
}

export function DocumentReviewModal({
  document,
  open,
  onClose,
  onAction,
}: DocumentReviewModalProps) {
  const [adminNotes, setAdminNotes] = useState(document.admin_notes || '');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Details */}
          <DocumentVerificationResult
            status={document.verification_status}
            score={document.verification_score || 0}
            details={document.verification_details}
            fileName={document.file_name}
          />

          {/* Admin Notes */}
          <div>
            <Label htmlFor="admin-notes" className="text-base font-semibold mb-2">
              Admin Notes
            </Label>
            <Textarea
              id="admin-notes"
              placeholder="Add notes for the user or internal records..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Action Buttons */}
          {(document.verification_status === 'flagged' || document.verification_status === 'pending') && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                className="flex-1"
                onClick={() => {
                  onAction(document.id, 'approve', adminNotes);
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Document
              </Button>

              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onAction(document.id, 'reject', adminNotes || 'Document does not meet requirements');
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Document
              </Button>

              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  onAction(document.id, 'request_reupload', adminNotes || 'Please upload a clearer image');
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Request Reupload
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
