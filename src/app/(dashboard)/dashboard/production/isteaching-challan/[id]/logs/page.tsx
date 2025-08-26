'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ChangeValue = string | number | boolean | null

type Changes = {
  [key: string]: {
    old: ChangeValue
    new: ChangeValue
  }
}

type ChangeLog = {
  id: number
  challan_id: number
  changed_by: string | null
  changes: Changes
  changed_at: string
  profile: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function IsteachingChallanLogsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [logs, setLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const { data: logsData, error: logsError } = await supabase
          .from('isteaching_challan_logs')
          .select('*')
          .eq('challan_id', parseInt(id))
          .order('changed_at', { ascending: false });

        if (logsError) {
          throw logsError;
        }

        if (!logsData || logsData.length === 0) {
          setLogs([]);
          return;
        }

        const userIds = logsData.map(log => log.changed_by).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);

          if (profilesError) {
            throw profilesError;
          }

          const combinedLogs = logsData.map(log => {
            const profile = profilesData.find(p => p.id === log.changed_by) || null;
            return { ...log, profile };
          });
          setLogs(combinedLogs);
        } else {
          setLogs(logsData.map(log => ({ ...log, profile: null })));
        }

      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [id]);

  const renderChange = (key: string, change: { old: ChangeValue; new: ChangeValue }) => {
    return (
      <div key={key} className="mb-2">
        <span className="font-semibold text-gray-700">{key.replace(/_/g, ' ')}:</span>
        <div className="flex items-center">
          <span className="text-red-600 line-through">{String(change.old)}</span>
          <span className="mx-2">→</span>
          <span className="text-green-600">{String(change.new)}</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Isteaching Challan Change Logs</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No change logs found for this challan.
          </CardContent>
        </Card>
      ) : (
        logs.map(log => (
          <Card key={log.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>
                  Change by {log.profile ? `${log.profile.first_name} ${log.profile.last_name}`.trim() : 'Unknown User'}
                </span>
                <Badge variant="secondary">
                  {new Date(log.changed_at).toLocaleString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(log.changes).map(([key, value]) => 
                  renderChange(key, value as { old: ChangeValue; new: ChangeValue })
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
