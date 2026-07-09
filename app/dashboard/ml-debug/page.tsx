'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DebugEntry {
  timestamp: string;
  window: number;
  amplitude: number;
  is_gunshot: boolean;
  confidence: number;
  features_mean: number;
}

interface DebugData {
  stats: {
    total_windows: number;
    gunshot_detections: number;
    avg_confidence: number;
    last_updated: string | null;
  };
  recent_history: DebugEntry[];
  message?: string;
}

export default function MLDebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const response = await fetch('/api/ml-debug');
        if (!response.ok) throw new Error('Failed to fetch debug data');
        const data = await response.json();
        setDebugData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
    const interval = setInterval(fetchDebugData, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-500">Loading ML debug data...</p>
      </div>
    );
  }

  if (error || !debugData) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              {error || debugData?.message || 'Failed to load debug data'}
            </p>
            <p className="text-sm text-red-600 mt-2">
              Make sure the Python serial bridge is running: <code>python arduino/serial_bridge.py</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const detectionRate =
    debugData.stats.total_windows > 0
      ? ((debugData.stats.gunshot_detections / debugData.stats.total_windows) * 100).toFixed(2)
      : '0.00';

  const chartData = debugData.recent_history.map((entry) => ({
    window: entry.window,
    confidence: Math.round(entry.confidence * 100) / 100,
    amplitude: entry.amplitude,
    isGunshot: entry.is_gunshot ? 1 : 0,
  }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">ML Model Debug Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time gunshot detection analysis</p>
        {debugData.stats.last_updated && (
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {new Date(debugData.stats.last_updated).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Windows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{debugData.stats.total_windows}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gunshot Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{debugData.stats.gunshot_detections}</p>
            <p className="text-xs text-gray-500 mt-1">{detectionRate}% detection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(debugData.stats.avg_confidence * 100).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">🟢 Active</p>
            <p className="text-xs text-gray-500 mt-1">Bridge running</p>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Trend</CardTitle>
          <CardDescription>Model confidence over recent windows</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="window" label={{ value: 'Window #', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Confidence', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#3b82f6" name="Confidence" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Amplitude vs Detection */}
      <Card>
        <CardHeader>
          <CardTitle>Amplitude vs Detection</CardTitle>
          <CardDescription>Audio amplitude with gunshot indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="window" label={{ value: 'Window #', position: 'insideBottomRight', offset: -5 }} />
              <YAxis label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="amplitude" fill="#8b5cf6" name="Amplitude" />
              <Bar dataKey="isGunshot" fill="#ef4444" name="Gunshot (1=Yes)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Detections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inferences</CardTitle>
          <CardDescription>Last {debugData.recent_history.length} processed windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Window</th>
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Amplitude</th>
                  <th className="text-left py-2 px-2">Confidence</th>
                  <th className="text-left py-2 px-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {debugData.recent_history.slice(-20).reverse().map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">#{entry.window}</td>
                    <td className="py-2 px-2 text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-2">{entry.amplitude}</td>
                    <td className="py-2 px-2">{(entry.confidence * 100).toFixed(1)}%</td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          entry.is_gunshot
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {entry.is_gunshot ? '🔴 GUNSHOT' : '✅ Clear'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Running the ML Bridge</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>To see real-time ML results, run the Python serial bridge in your terminal:</p>
          <code className="block bg-white p-2 border border-blue-200 rounded mt-2">
            python arduino/serial_bridge.py
          </code>
          <p className="mt-2">Make sure your Arduino is connected and running the SentinelSound sketch.</p>
        </CardContent>
      </Card>
    </div>
  );
}
