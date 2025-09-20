'use client';

import BatchHistory from '@/components/production/batch-history';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function BatchHistoryPage() {
  const params = useParams();
  const batchNumberParam = params.batch_number;

  // Ensure we always pass a string to the BatchHistory component
  const batchNumber = Array.isArray(batchNumberParam)
    ? batchNumberParam[0] // Take the first element if it's an array
    : batchNumberParam;

  if (!batchNumber) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Batch Number</CardTitle>
            <CardDescription>
              No batch number provided in the URL
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <BatchHistory batchNumber={batchNumber} />;
}