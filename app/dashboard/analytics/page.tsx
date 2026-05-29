"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, PieChart, TrendingUp, Calendar, Target, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface PoachingEvent {
  id:                  number
  timestamp:           string
  event_type:          string
  confidence:          number
  verification_status: string
  severity:            string
  node_id:             string
}

interface SensorNode {
  id:            string
  name:          string
  status:        string
  battery_level: number
  last_seen:     string
  zone:          string
}

interface AnalyticsData {
  events:             PoachingEvent[]
  nodes:              SensorNode[]
  dailyCounts:        Record<string, number>
  eventTypeCounts:    Record<string, number>
  verificationStats:  Record<string, number>
  severityCounts:     Record<string, number>
  nodeActivityCounts: Record<string, number>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    events: [], nodes: [], dailyCounts: {}, eventTypeCounts: {},
    verificationStats: {}, severityCounts: {}, nodeActivityCounts: {},
  })
  const [loading,   setLoading]   = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?range=${timeRange}`)
      const { events, nodes } = await res.json() as { events: PoachingEvent[]; nodes: SensorNode[] }

      const dailyCounts:        Record<string, number> = {}
      const eventTypeCounts:    Record<string, number> = {}
      const verificationStats:  Record<string, number> = {}
      const severityCounts:     Record<string, number> = {}
      const nodeActivityCounts: Record<string, number> = {}

      for (const event of events) {
        const day = new Date(event.timestamp).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        })
        dailyCounts[day]                              = (dailyCounts[day]                              || 0) + 1
        eventTypeCounts[event.event_type]             = (eventTypeCounts[event.event_type]             || 0) + 1
        verificationStats[event.verification_status]  = (verificationStats[event.verification_status]  || 0) + 1
        severityCounts[event.severity]                = (severityCounts[event.severity]                || 0) + 1
        nodeActivityCounts[event.node_id]             = (nodeActivityCounts[event.node_id]             || 0) + 1
      }

      setData({ events, nodes, dailyCounts, eventTypeCounts, verificationStats, severityCounts, nodeActivityCounts })
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
    setLoading(false)
  }

  const getMaxValue = (obj: Record<string, number>) => Math.max(...Object.values(obj), 1)

  const totalEvents      = data.events.length
  const verifiedPoaching = data.verificationStats['verified_poaching'] || 0
  const falsePositives   = data.verificationStats['false_positive']    || 0
  const pendingReview    = data.verificationStats['pending']           || 0
  const falsePositiveRate = totalEvents > 0 ? ((falsePositives / totalEvents) * 100).toFixed(1) : '0'
  const accuracyRate      = totalEvents > 0
    ? (((verifiedPoaching + falsePositives) / totalEvents) * 100).toFixed(1)
    : '0'
  const onlineNodes = data.nodes.filter(n => n.status === 'online').length
  const totalNodes  = data.nodes.length

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'gunshot':        return '🔫'
      case 'chainsaw':       return '🪚'
      case 'vehicle':        return '🚗'
      case 'animal_distress':return '🦁'
      case 'human_voice':    return '🗣️'
      case 'explosion':      return '💥'
      case 'trap_sound':     return '🪤'
      default:               return '⚠️'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Historical trends and performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-3xl font-bold">{totalEvents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified Threats</p>
                    <p className="text-3xl font-bold text-red-500">{verifiedPoaching}</p>
                  </div>
                  <Target className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">False Positive Rate</p>
                    <p className="text-3xl font-bold text-green-500">{falsePositiveRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Network Uptime</p>
                    <p className="text-3xl font-bold text-blue-500">
                      {totalNodes > 0 ? Math.round((onlineNodes / totalNodes) * 100) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="events" className="space-y-4">
            <TabsList>
              <TabsTrigger value="events">Event Trends</TabsTrigger>
              <TabsTrigger value="types">Event Types</TabsTrigger>
              <TabsTrigger value="verification">Verification Stats</TabsTrigger>
              <TabsTrigger value="nodes">Node Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Event Count</CardTitle>
                  <CardDescription>Number of acoustic detections per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(data.dailyCounts).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No events in selected time range</p>
                    ) : (
                      Object.entries(data.dailyCounts).map(([day, count]) => (
                        <div key={day} className="flex items-center gap-3">
                          <span className="w-32 text-sm text-muted-foreground">{day}</span>
                          <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${(count / getMaxValue(data.dailyCounts)) * 100}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono text-sm">{count}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="types">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Type Distribution</CardTitle>
                    <CardDescription>Breakdown by detection category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(data.eventTypeCounts).length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No data available</p>
                      ) : (
                        Object.entries(data.eventTypeCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([type, count]) => (
                            <div key={type} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">{getEventIcon(type)}</span>
                                  <span className="capitalize text-sm">{type.replace('_', ' ')}</span>
                                </span>
                                <span className="font-mono text-sm">
                                  {count} ({totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0}%)
                                </span>
                              </div>
                              <Progress value={totalEvents > 0 ? (count / totalEvents) * 100 : 0} className="h-2" />
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Severity Distribution</CardTitle>
                    <CardDescription>Events by severity level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(['critical','high','medium','low'] as const).map(severity => {
                        const count = data.severityCounts[severity] || 0
                        const colors: Record<string, string> = {
                          critical: 'bg-red-500',
                          high:     'bg-orange-500',
                          medium:   'bg-yellow-500',
                          low:      'bg-green-500',
                        }
                        return (
                          <div key={severity} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={severity === 'critical' ? 'destructive' : severity === 'high' ? 'default' : 'secondary'}>
                                {severity.toUpperCase()}
                              </Badge>
                              <span className="font-mono text-sm">{count} events</span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colors[severity]} transition-all duration-500`}
                                style={{ width: `${totalEvents > 0 ? (count / totalEvents) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="verification">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Verification Breakdown
                    </CardTitle>
                    <CardDescription>Status of reviewed detections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30 text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{verifiedPoaching}</p>
                        <p className="text-xs text-muted-foreground">Verified Poaching</p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 text-center">
                        <XCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{falsePositives}</p>
                        <p className="text-xs text-muted-foreground">False Positives</p>
                      </div>
                      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{pendingReview}</p>
                        <p className="text-xs text-muted-foreground">Pending Review</p>
                      </div>
                      <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 text-center">
                        <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{data.verificationStats['under_review'] || 0}</p>
                        <p className="text-xs text-muted-foreground">Under Review</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ML Classifier Performance</CardTitle>
                    <CardDescription>Model accuracy metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Review Completion Rate</span>
                        <span className="font-mono">{accuracyRate}%</span>
                      </div>
                      <Progress value={parseFloat(accuracyRate)} className="h-3" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>True Positive Rate</span>
                        <span className="font-mono">
                          {(verifiedPoaching + falsePositives) > 0
                            ? ((verifiedPoaching / (verifiedPoaching + falsePositives)) * 100).toFixed(1)
                            : '0'}%
                        </span>
                      </div>
                      <Progress
                        value={(verifiedPoaching + falsePositives) > 0
                          ? (verifiedPoaching / (verifiedPoaching + falsePositives)) * 100
                          : 0}
                        className="h-3"
                      />
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Based on {verifiedPoaching + falsePositives} verified detections out of {totalEvents} total events.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="nodes">
              <Card>
                <CardHeader>
                  <CardTitle>Node Activity & Health</CardTitle>
                  <CardDescription>Detection count and status by sensor node</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.nodes.map(node => {
                      const eventCount = data.nodeActivityCounts[node.id] || 0
                      return (
                        <div key={node.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm">{node.id}</span>
                              <Badge variant={
                                node.status === 'online'      ? 'default' :
                                node.status === 'maintenance' ? 'secondary' : 'destructive'
                              }>
                                {node.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{node.zone}</p>
                          </div>
                          <div className="text-center px-4">
                            <p className="text-lg font-bold">{eventCount}</p>
                            <p className="text-xs text-muted-foreground">detections</p>
                          </div>
                          <div className="w-32">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Battery</span>
                              <span className={`text-xs font-mono ${
                                node.battery_level > 50 ? 'text-green-500' :
                                node.battery_level > 20 ? 'text-yellow-500' : 'text-red-500'
                              }`}>{node.battery_level}%</span>
                            </div>
                            <Progress value={node.battery_level} className="h-2" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
