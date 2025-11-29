"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, AlertTriangle, Shield, Radio, Battery, Wifi, WifiOff, Volume2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase"
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div>
})

interface SensorNode {
  id: string
  name: string
  gps_lat: number
  gps_lon: number
  battery_level: number
  status: 'online' | 'offline' | 'maintenance'
  zone: string
  last_seen: string
}

interface PoachingEvent {
  id: number
  node_id: string
  timestamp: string
  event_type: string
  confidence: number
  severity: string
  verification_status: string
  sensor_nodes?: SensorNode
}

interface DashboardStats {
  totalEvents: number
  criticalEvents: number
  onlineNodes: number
  totalNodes: number
  deployedPatrols: number
}

export default function DashboardPage() {
  const [nodes, setNodes] = useState<SensorNode[]>([])
  const [recentEvents, setRecentEvents] = useState<PoachingEvent[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    criticalEvents: 0,
    onlineNodes: 0,
    totalNodes: 0,
    deployedPatrols: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    
    // Subscribe to real-time updates
    const eventsChannel = supabase
      .channel('dashboard-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'poaching_events' }, (payload) => {
        setRecentEvents(prev => [payload.new as PoachingEvent, ...prev.slice(0, 4)])
        setStats(prev => ({
          ...prev,
          totalEvents: prev.totalEvents + 1,
          criticalEvents: (payload.new as PoachingEvent).severity === 'critical' ? prev.criticalEvents + 1 : prev.criticalEvents
        }))
      })
      .subscribe()

    const nodesChannel = supabase
      .channel('dashboard-nodes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_nodes' }, () => {
        fetchNodes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(eventsChannel)
      supabase.removeChannel(nodesChannel)
    }
  }, [])

  const fetchDashboardData = async () => {
    await Promise.all([fetchNodes(), fetchRecentEvents(), fetchStats()])
    setLoading(false)
  }

  const fetchNodes = async () => {
    const { data } = await supabase.from('sensor_nodes').select('*')
    if (data) {
      setNodes(data)
      setStats(prev => ({
        ...prev,
        onlineNodes: data.filter(n => n.status === 'online').length,
        totalNodes: data.length
      }))
    }
  }

  const fetchRecentEvents = async () => {
    const { data } = await supabase
      .from('poaching_events')
      .select('*, sensor_nodes(name, zone)')
      .order('timestamp', { ascending: false })
      .limit(5)
    if (data) setRecentEvents(data)
  }

  const fetchStats = async () => {
    const { data: events } = await supabase.from('poaching_events').select('id, severity')
    const { data: patrols } = await supabase.from('patrol_units').select('id, status')
    
    if (events) {
      setStats(prev => ({
        ...prev,
        totalEvents: events.length,
        criticalEvents: events.filter(e => e.severity === 'critical').length
      }))
    }
    if (patrols) {
      setStats(prev => ({
        ...prev,
        deployedPatrols: patrols.filter(p => p.status === 'deployed' || p.status === 'responding').length
      }))
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'gunshot': return '🔫'
      case 'chainsaw': return '🪚'
      case 'vehicle': return '🚗'
      case 'animal_distress': return '🦁'
      default: return '⚠️'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins} mins ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} hours ago`
    return `${Math.floor(hours / 24)} days ago`
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Stats Cards */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events (24h)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive font-medium">{stats.criticalEvents} critical</span> requiring response
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sensors
            </CardTitle>
            <Radio className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.onlineNodes}/{stats.totalNodes}</div>
            <Progress value={(stats.onlineNodes / stats.totalNodes) * 100} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.onlineNodes / stats.totalNodes) * 100)}% Network Uptime
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Patrol Units
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.deployedPatrols}</div>
            <p className="text-xs text-muted-foreground">
              Currently deployed in field
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ML Classifier
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Active</div>
            <p className="text-xs text-muted-foreground">
              v2.1.0 • 94.2% Accuracy
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Sensor Nodes Grid */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Sensor Node Status
          </CardTitle>
          <CardDescription>Real-time health monitoring of ESP32 acoustic sensors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {nodes.map(node => (
              <div 
                key={node.id} 
                className={`p-3 rounded-lg border ${
                  node.status === 'online' ? 'border-green-500/30 bg-green-500/5' :
                  node.status === 'maintenance' ? 'border-yellow-500/30 bg-yellow-500/5' :
                  'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-muted-foreground">{node.id}</span>
                  {node.status === 'online' ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : node.status === 'maintenance' ? (
                    <Wifi className="h-3 w-3 text-yellow-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <p className="text-xs font-medium truncate mb-2">{node.zone}</p>
                <div className="flex items-center gap-1">
                  <Battery className={`h-3 w-3 ${
                    node.battery_level > 50 ? 'text-green-500' :
                    node.battery_level > 20 ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                  <span className="text-xs">{node.battery_level}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              SentinelSound Live Map
            </CardTitle>
            <CardDescription>Bandipur National Park sensor network coverage</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full rounded-md overflow-hidden">
               <Map />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Real-Time Event Feed
            </CardTitle>
            <CardDescription>Latest acoustic detections from the network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading events...</div>
              ) : recentEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No recent events</div>
              ) : (
                recentEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getEventTypeIcon(event.event_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground capitalize">
                            {event.event_type.replace('_', ' ')}
                          </p>
                          <Badge variant={getSeverityColor(event.severity) as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                            {Math.round(event.confidence * 100)}% conf
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(event.sensor_nodes as unknown as SensorNode)?.zone || event.node_id} • {getTimeAgo(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        event.verification_status === 'verified_poaching' ? 'destructive' :
                        event.verification_status === 'false_positive' ? 'outline' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {event.verification_status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
