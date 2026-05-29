'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LiveStats() {
  const [threatCount, setThreatCount] = useState<number | null>(null);
  const [loading, setLoading]         = useState(true);

  const fetchStats = async () => {
    try {
      const res  = await fetch('/api/stats');
      const data = await res.json();
      setThreatCount(data.totalEvents);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setThreatCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
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
              <div className="h-12 w-32 bg-forest-700 animate-pulse rounded mx-auto md:ml-auto" />
            ) : (
              <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                {threatCount !== null ? threatCount.toLocaleString() : '---'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
