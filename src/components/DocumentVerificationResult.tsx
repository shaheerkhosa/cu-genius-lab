import { CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VerificationDetails {
  score: number;
  document_type_match: boolean;
  elements_found: Array<{
    name: string;
    found: boolean;
    confidence: number;
  }>;
  quality_assessment: string;
  issues: Array<{
    type: string;
    message: string;
  }>;
  recommendation: string;
}

interface DocumentVerificationResultProps {
  status: string;
  score: number;
  details: VerificationDetails;
  fileName: string;
}

export function DocumentVerificationResult({
  status,
  score,
  details,
  fileName,
}: DocumentVerificationResultProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'flagged':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <FileText className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, any> = {
      verified: 'default',
      flagged: 'secondary',
      rejected: 'destructive',
      pending: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <CardTitle className="text-lg">{fileName}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Verification Score</span>
            <span className="text-2xl font-bold text-primary">{score}/100</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Elements found */}
        <div>
          <h4 className="text-sm font-medium mb-2">Document Elements</h4>
          <div className="grid grid-cols-2 gap-2">
            {details?.elements_found?.map((element, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/30"
              >
                {element.found ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span className="truncate">{element.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issues */}
        {details?.issues && details.issues.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Issues Detected</h4>
            <ul className="space-y-2">
              {details.issues.map((issue, i) => (
                <li
                  key={i}
                  className={`text-sm p-2 rounded-lg flex items-start gap-2 ${
                    issue.type === 'error'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        {details?.recommendation && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{details.recommendation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
