"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, Filter, Volume2, ExternalLink } from "lucide-react"

interface PoachingEvent {
  id: number
  node_id: string
  timestamp: string
  event_type: string
  confidence: number
  audio_url: string
  verification_status: string
  severity: string
  notes: string
  sensor_nodes?: {
    name: string
    zone: string
    gps_lat: number
    gps_lon: number
  }
}

export default function AlertsPage() {
  const [events, setEvents] = useState<PoachingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<PoachingEvent | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchEvents()
    
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poaching_events' }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filterStatus, filterType])

  const fetchEvents = async () => {
    let query = supabase
      .from('poaching_events')
      .select('*, sensor_nodes(name, zone, gps_lat, gps_lon)')
      .order('timestamp', { ascending: false })
    
    if (filterStatus !== 'all') {
      query = query.eq('verification_status', filterStatus)
    }
    if (filterType !== 'all') {
      query = query.eq('event_type', filterType)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching events:', error)
    } else {
      setEvents(data || [])
    }
    setLoading(false)
  }

  const updateVerificationStatus = async (eventId: number, status: string) => {
    const { error } = await supabase
      .from('poaching_events')
      .update({ 
        verification_status: status,
        verified_at: new Date().toISOString()
      })
      .eq('id', eventId)
    
    if (!error) {
      setDialogOpen(false)
      fetchEvents()
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'gunshot': return '🔫'
      case 'chainsaw': return '🪚'
      case 'vehicle': return '🚗'
      case 'animal_distress': return '🦁'
      case 'human_voice': return '🗣️'
      case 'explosion': return '💥'
      case 'trap_sound': return '🪤'
      default: return '⚠️'
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    }
    return <Badge variant={variants[severity] || 'outline'}>{severity.toUpperCase()}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified_poaching':
        return <Badge variant="destructive" className="gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>
      case 'false_positive':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />False Positive</Badge>
      case 'under_review':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Under Review</Badge>
      default:
        return <Badge variant="default" className="gap-1"><AlertTriangle className="h-3 w-3" />Pending</Badge>
    }
  }
  
  const pendingCount = events.filter(e => e.verification_status === 'pending').length
  const verifiedCount = events.filter(e => e.verification_status === 'verified_poaching').length
  const falsePositiveCount = events.filter(e => e.verification_status === 'false_positive').length

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-xs text-muted-foreground">Verified Poaching</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{falsePositiveCount}</p>
              <p className="text-xs text-muted-foreground">False Positives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Volume2 className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Poaching Events Log
              </CardTitle>
              <CardDescription>
                Review and verify acoustic detections from SentinelSound network
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="gunshot">Gunshot</SelectItem>
                  <SelectItem value="chainsaw">Chainsaw</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="animal_distress">Animal Distress</SelectItem>
                  <SelectItem value="trap_sound">Trap Sound</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified_poaching">Verified</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableCaption>Acoustic detection events from ESP32 sensor network</TableCaption>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground w-[80px]">ID</TableHead>
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground">Location</TableHead>
                  <TableHead className="text-muted-foreground">Confidence</TableHead>
                  <TableHead className="text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No events found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">#{event.id}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{getEventIcon(event.event_type)}</span>
                          <span className="capitalize text-sm">{event.event_type.replace('_', ' ')}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <p className="font-medium">{event.sensor_nodes?.zone || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{event.node_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                event.confidence > 0.9 ? 'bg-red-500' :
                                event.confidence > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${event.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono">{Math.round(event.confidence * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell>{getStatusBadge(event.verification_status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {event.audio_url && (
                            <Button variant="ghost" size="icon" title="Play Audio">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event)
                              setDialogOpen(true)
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedEvent && getEventIcon(selectedEvent.event_type)}</span>
              Event #{selectedEvent?.id} - {selectedEvent?.event_type.replace('_', ' ').toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Review the detection and verify the event classification
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Detection Time</p>
                  <p className="font-medium">{new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Confidence Score</p>
                  <p className="font-medium text-xl">{Math.round(selectedEvent.confidence * 100)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedEvent.sensor_nodes?.zone}</p>
                  <p className="text-xs text-muted-foreground">
                    Node: {selectedEvent.node_id} | 
                    GPS: {selectedEvent.sensor_nodes?.gps_lat}, {selectedEvent.sensor_nodes?.gps_lon}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  {getStatusBadge(selectedEvent.verification_status)}
                </div>
              </div>

              {selectedEvent.audio_url && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Audio Recording (5s)</p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                      <Play className="h-4 w-4" />
                      Play Audio
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Open in new tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline"
              onClick={() => selectedEvent && updateVerificationStatus(selectedEvent.id, 'false_positive')}
            >
              <XCircle className="h-4 w-4 mr-2" />
              False Positive
            </Button>
            <Button 
              variant="secondary"
              onClick={() => selectedEvent && updateVerificationStatus(selectedEvent.id, 'under_review')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Under Review
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedEvent && updateVerificationStatus(selectedEvent.id, 'verified_poaching')}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Confirm Poaching
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
