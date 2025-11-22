'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle } from 'lucide-react';

export default function LiveStats() {
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            throw new Error("Supabase not configured");
        }

        const { count, error } = await supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setThreatCount(count);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        setError(err.message || 'Failed to connect');
        // Fallback for demo purposes if no DB connection
        setThreatCount(0); 
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="bg-muted border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-2xl p-8 border border-border flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          
          <div className="flex items-center gap-4">
            <div className="p-4 bg-destructive/10 rounded-full border border-destructive/20 animate-pulse">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-card-foreground">Total Threats Detected</h3>
              <p className="text-sm text-muted-foreground">Since system initialization</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            {loading ? (
              <div className="h-12 w-32 bg-forest-700 animate-pulse rounded mx-auto md:ml-auto"></div>
            ) : (
              <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                {threatCount !== null ? threatCount.toLocaleString() : '---'}
              </div>
            )}
            {error && (
               <p className="text-xs text-red-400 mt-2">
                 {error === "Supabase not configured" ? "Database not connected" : "Syncing..."}
               </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
