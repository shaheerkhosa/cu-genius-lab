import { useEffect, useRef, useState } from 'react';
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { DocumentUploader } from '@/components/DocumentUploader';
import { DocumentHistory } from '@/components/DocumentHistory';
import { gsap } from 'gsap';

const Documents = () => {
  const headerRef = useRef<HTMLHeadingElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Page entrance animations
    const tl = gsap.timeline();
    
    tl.from(headerRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.6,
      ease: 'power3.out',
    })
    .from(uploaderRef.current, {
      opacity: 0,
      y: 30,
      scale: 0.95,
      duration: 0.6,
      ease: 'power3.out',
    }, '-=0.3')
    .from(historyRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power3.out',
    }, '-=0.3');
  }, []);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <h1 ref={headerRef} className="text-4xl font-bold text-primary text-center">
            Upload & Verify Documents
          </h1>
          
          <div ref={uploaderRef}>
            <DocumentUploader onUploadSuccess={handleUploadSuccess} />
          </div>

          <div ref={historyRef} className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Recent Documents</h2>
            <DocumentHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Documents;
