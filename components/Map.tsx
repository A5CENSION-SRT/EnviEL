"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function Map() {
  return (
    <MapContainer 
      center={[11.6664, 76.6292]} 
      zoom={11} 
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[11.6664, 76.6292]} icon={icon}>
        <Popup>
          Bandipur National Park <br /> Central Monitoring Station
        </Popup>
      </Marker>
      <Marker position={[11.68, 76.65]} icon={icon}>
        <Popup>
          Moyar River Sensor #4 <br /> Status: Active
        </Popup>
      </Marker>
      <Marker position={[11.65, 76.60]} icon={icon}>
        <Popup>
          Himavad Gopalaswamy Betta <br /> Patrol Unit Alpha
        </Popup>
      </Marker>
    </MapContainer>
  )
}
