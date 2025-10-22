import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requestManager } from '@/services/RequestManager';

export function RequestMonitor() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPendingCount(requestManager.getPendingRequestCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) {
    return null; // Don't show if no pending requests
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-64">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>API Requests</span>
            <Badge variant={pendingCount > 5 ? "destructive" : "secondary"}>
              {pendingCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">
            {pendingCount > 5 
              ? "⚠️ High number of pending requests detected" 
              : "Active API requests"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 