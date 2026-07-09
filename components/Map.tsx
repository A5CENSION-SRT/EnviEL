"use client"

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useState } from 'react'

const sensorIcon = L.icon({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
})

interface SensorNode {
  id:            string
  name:          string
  gps_lat:       number
  gps_lon:       number
  status:        string
  zone:          string
  battery_level: number
  last_seen:     string
}

interface PoachingEvent {
  id:                  number
  node_id:             string
  event_type:          string
  timestamp:           string
  confidence:          number
  severity:            string
  verification_status: string
  gps_lat:             number | null
  gps_lon:             number | null
}

export default function Map() {
  const [sensors,      setSensors]      = useState<SensorNode[]>([])
  const [recentEvents, setRecentEvents] = useState<PoachingEvent[]>([])
  const [mapCenter,    setMapCenter]    = useState<[number, number]>([12.92323, 77.50064])

  const fetchSensors = async () => {
    try {
      const res  = await fetch('/api/nodes')
      const data = await res.json() as SensorNode[]
      setSensors(data)
      if (data.length > 0 && data[0].gps_lat && data[0].gps_lon) {
        setMapCenter([data[0].gps_lat, data[0].gps_lon])
      }
    } catch (err) {
      console.error('Failed to fetch sensors:', err)
    }
  }

  const fetchRecentEvents = async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const res  = await fetch(`/api/events?since=${encodeURIComponent(oneDayAgo)}&limit=50`)
      const data = await res.json() as PoachingEvent[]
      setRecentEvents(data.filter(e =>
        e.verification_status === 'pending' || e.verification_status === 'verified_poaching'
      ))
    } catch (err) {
      console.error('Failed to fetch events:', err)
    }
  }

  useEffect(() => {
    fetchSensors()
    fetchRecentEvents()
    const interval = setInterval(() => {
      fetchSensors()
      fetchRecentEvents()
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':      return 'text-green-500'
      case 'offline':     return 'text-red-500'
      case 'maintenance': return 'text-yellow-500'
      default:            return 'text-gray-500'
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={18}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sensors.map((sensor) => (
          <Marker
            key={sensor.id}
            position={[sensor.gps_lat, sensor.gps_lon]}
            icon={sensorIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-base">{sensor.name}</strong><br />
                <span className="text-gray-600">ID: {sensor.id}</span><br />
                <span className="text-gray-600">Location: {sensor.zone || 'Unassigned'}</span><br />
                <span className={getStatusColor(sensor.status)}>
                  ● {sensor.status.charAt(0).toUpperCase() + sensor.status.slice(1)}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {recentEvents.map((event) => {
          if (!event.gps_lat || !event.gps_lon) return null

          const isVerified = event.verification_status === 'verified_poaching'
          const isAmbient = event.event_type === 'ambient_noise'
          const color = isAmbient
            ? '#10b981' // emerald/green for ambient
            : event.severity === 'critical' || event.severity === 'high'
              ? '#ef4444'
              : event.severity === 'medium'
                ? '#f59e0b'
                : '#3b82f6'

          return (
            <CircleMarker
              key={event.id}
              center={[event.gps_lat, event.gps_lon]}
              radius={isAmbient ? 8 : (isVerified ? 15 : 10)}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.4, weight: 2 }}
            >
              <Popup>
                <div className="text-sm">
                  <strong className={isAmbient ? "text-emerald-600" : "text-red-600"}>
                    {event.event_type.replace('_', ' ').toUpperCase()}
                  </strong><br />
                  {!isAmbient && (
                    <>
                      <span>Confidence: {(event.confidence * 100).toFixed(0)}%</span><br />
                      <span>Severity: {event.severity}</span><br />
                    </>
                  )}
                  {isAmbient && <span>Detail: {event.notes}</span>}
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

      {/* Map Legend Overlay Key */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          padding: '10px 14px',
          zIndex: 1000,
          color: '#ffffff',
          fontSize: '11px',
          fontFamily: 'sans-serif',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          minWidth: '150px'
        }}
      >
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '2px', fontSize: '12px' }}>
          Map Index Key
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" style={{ height: '14px', width: '9px' }} alt="Sensor" />
          <span>Acoustic Sensor Node</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', border: '1.5px solid #ffffff' }}></span>
          <span>Animal Distress Detection</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', border: '1.5px solid #ffffff' }}></span>
          <span>Ambient Telemetry</span>
        </div>
      </div>
    </div>
  )
}
