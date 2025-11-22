"use client"

import { Card } from "@/components/ui/card"
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div>
})

export default function MapPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 h-[calc(100vh-4rem)]">
      <Card className="flex-1 bg-card border-border relative overflow-hidden flex flex-col shadow-sm">
        <div className="absolute top-4 left-4 z-[400] bg-card/90 backdrop-blur p-4 rounded-lg border border-border shadow-lg max-w-xs">
            <h2 className="text-lg font-bold text-card-foreground mb-1">Live Topographic Map</h2>
            <p className="text-xs text-muted-foreground mb-3">Real-time sensor data and threat detection.</p>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
                    <span className="text-xs text-card-foreground font-medium">Active Threat</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    <span className="text-xs text-card-foreground font-medium">Sensor Online</span>
                </div>
            </div>
        </div>
        <div className="flex-1 w-full h-full">
            <Map />
        </div>
      </Card>
    </div>
  )
}
