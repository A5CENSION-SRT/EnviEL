"use client"

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Fix for default marker icon
const sensorIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface SensorNode {
  id: string
  name: string
  gps_lat: number
  gps_lon: number
  status: string
  zone: string
  battery_level: number
  last_seen: string
}

interface PoachingEvent {
  id: number
  node_id: string
  event_type: string
  timestamp: string
  confidence: number
  severity: string
  verification_status: string
  sensor_nodes: {
    gps_lat: number
    gps_lon: number
  }
}

export default function Map() {
  const [sensors, setSensors] = useState<SensorNode[]>([])
  const [recentEvents, setRecentEvents] = useState<PoachingEvent[]>([])
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.6664, 76.6292])

  useEffect(() => {
    fetchSensors()
    fetchRecentEvents()

    // Real-time subscription for events
    const channel = supabase
      .channel('map-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poaching_events' }, () => {
        fetchRecentEvents()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sensor_nodes' }, () => {
        fetchSensors()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSensors = async () => {
    const { data, error } = await supabase
      .from('sensor_nodes')
      .select('*')
      .order('last_seen', { ascending: false })

    if (!error && data && data.length > 0) {
      setSensors(data)
      // Center map on first sensor
      setMapCenter([data[0].gps_lat, data[0].gps_lon])
    }
  }

  const fetchRecentEvents = async () => {
    // Get events from last 24 hours that are pending or verified
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('poaching_events')
      .select('*, sensor_nodes(gps_lat, gps_lon)')
      .gte('timestamp', oneDayAgo)
      .in('verification_status', ['pending', 'verified_poaching'])
      .order('timestamp', { ascending: false })
      .limit(50)

    if (!error && data) {
      setRecentEvents(data)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500'
      case 'offline': return 'text-red-500'
      case 'maintenance': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={11} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Sensor Nodes */}
      {sensors.map((sensor) => (
        <Marker 
          key={sensor.id} 
          position={[sensor.gps_lat, sensor.gps_lon]} 
          icon={sensorIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong className="text-base">{sensor.name}</strong>
              <br />
              <span className="text-gray-600">ID: {sensor.id}</span>
              <br />
              <span className="text-gray-600">Zone: {sensor.zone || 'Unassigned'}</span>
              <br />
              <span className={getStatusColor(sensor.status)}>
                ● {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
              </span>
              <br />
              <span className="text-gray-600">Battery: {sensor.battery_level}%</span>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Recent Events (Threat Indicators) */}
      {recentEvents.map((event) => {
        if (!event.sensor_nodes?.gps_lat) return null
        
        const isVerified = event.verification_status === 'verified_poaching'
        const color = event.severity === 'high' || event.severity === 'critical' 
          ? '#ef4444' 
          : event.severity === 'medium' 
            ? '#f59e0b' 
            : '#3b82f6'

        return (
          <CircleMarker
            key={event.id}
            center={[event.sensor_nodes.gps_lat, event.sensor_nodes.gps_lon]}
            radius={isVerified ? 15 : 10}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.4,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-red-600">⚠️ {event.event_type.toUpperCase()}</strong>
                <br />
                <span>Confidence: {(event.confidence * 100).toFixed(0)}%</span>
                <br />
                <span>Severity: {event.severity}</span>
                <br />
                <span className="text-gray-500 text-xs">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
