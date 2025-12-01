import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DecorativeBackground } from '@/components/DecorativeBackground';
import { AdminDocumentQueue } from '@/components/AdminDocumentQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { gsap } from 'gsap';
import { Shield, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminDocuments = () => {
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ pending: 0, flagged: 0, verified: 0, rejected: 0 });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/documents');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();

      // Page entrance animations
      const tl = gsap.timeline();
      tl.from(headerRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: 'power3.out',
      })
        .from(statsRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
        }, '-=0.3')
        .from(queueRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power3.out',
        }, '-=0.3');
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('verification_status');

      if (error) throw error;

      const counts = {
        pending: data.filter(d => d.verification_status === 'pending').length,
        flagged: data.filter(d => d.verification_status === 'flagged').length,
        verified: data.filter(d => d.verification_status === 'verified').length,
        rejected: data.filter(d => d.verification_status === 'rejected').length,
      };

      setStats(counts);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="relative min-h-screen p-8">
        <DecorativeBackground />

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div ref={headerRef} className="flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-primary">Admin Document Queue</h1>
              <p className="text-muted-foreground mt-1">Review and manage submitted documents</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Flagged</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.flagged}</p>
                  </div>
                  <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.pending}</p>
                  </div>
                  <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-500/20 bg-green-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.verified}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-500/20 bg-red-500/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Tabs */}
          <div ref={queueRef}>
            <Tabs defaultValue="flagged" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="flagged">Flagged ({stats.flagged})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="flagged" className="mt-6">
                <AdminDocumentQueue statusFilter="flagged" />
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                <AdminDocumentQueue statusFilter="pending" />
              </TabsContent>

              <TabsContent value="verified" className="mt-6">
                <AdminDocumentQueue statusFilter="verified" />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <AdminDocumentQueue statusFilter="rejected" />
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <AdminDocumentQueue statusFilter="all" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDocuments;
