import { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { gsap } from 'gsap';

const DOCUMENT_TYPES = [
  { value: 'matric_certificate', label: 'Matric Certificate (SSC)' },
  { value: 'olevel_result', label: 'O-Level Result' },
  { value: 'alevel_result', label: 'A-Level Result' },
  { value: 'health_certificate', label: 'Health Certificate' },
  { value: 'character_certificate', label: 'Character Certificate' },
  { value: 'domicile', label: 'Domicile Certificate' },
  { value: 'ibcc', label: 'IBCC Equivalence' },
  { value: 'cnic', label: 'CNIC' },
];

interface DocumentUploaderProps {
  onUploadSuccess: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [documentType, setDocumentType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    // Pulse animation on file select
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast({
        title: 'Missing Information',
        description: 'Please select both document type and file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Convert file to base64 for AI analysis
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        // Call verification edge function
        const { error: functionError } = await supabase.functions.invoke('verify-document', {
          body: {
            imageBase64: base64,
            documentType,
            documentId: document.id,
          },
        });

        if (functionError) {
          console.error('Verification error:', functionError);
          toast({
            title: 'Verification Failed',
            description: 'Document uploaded but verification failed. Admins will review manually.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Upload Successful',
            description: 'Document uploaded and verified successfully!',
          });
        }

        setUploading(false);
        setFile(null);
        setDocumentType('');
        onUploadSuccess();
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
      setUploading(false);
    }
  };

  return (
    <Card
      ref={cardRef}
      className="relative overflow-hidden border-2 border-border/50 backdrop-blur-xl bg-card/30 shadow-xl"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-12 flex flex-col items-center gap-6">
        {/* Badge */}
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
          Upload & Verify
        </div>

        {/* Upload icon */}
        <div className={`relative transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-2 border-dashed border-border">
            {file ? (
              <FileText className="w-16 h-16 text-primary" />
            ) : (
              <Upload className="w-16 h-16 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* File info or instruction */}
        {file ? (
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            Drag & drop your document here or click to browse
          </p>
        )}

        {/* Document type selector */}
        <Select value={documentType} onValueChange={setDocumentType}>
          <SelectTrigger className="w-full max-w-sm bg-background/50 backdrop-blur">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="bg-background/50 backdrop-blur"
          >
            <FileText className="w-4 h-4 mr-2" />
            Select File
          </Button>

          <Button
            onClick={handleUpload}
            disabled={!file || !documentType || uploading}
            className="min-w-32"
          >
            {uploading ? 'Verifying...' : 'Upload & Verify'}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) handleFileSelect(selectedFile);
          }}
        />
      </div>
    </Card>
  );
}
