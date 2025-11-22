"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, Shield } from "lucide-react"
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Map...</div>
})

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Threats
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">12</div>
            <p className="text-xs text-muted-foreground">
              +2 from last hour
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sensors
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">24/25</div>
            <p className="text-xs text-muted-foreground">
              96% Uptime
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
            <div className="text-2xl font-bold text-card-foreground">4</div>
            <p className="text-xs text-muted-foreground">
              Deployed in Omkar Range
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Bandipur Live Map Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full rounded-md overflow-hidden">
               <Map />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-border shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {[
                  { id: 1, alert: "Chainsaw Activity Detected", loc: "Moyar River Bank", time: "2 mins ago" },
                  { id: 2, alert: "Unauthorized Vehicle", loc: "Gundlupet Buffer Zone", time: "15 mins ago" },
                  { id: 3, alert: "Gunshot Pattern Match", loc: "Kekkanhalla Checkpost", time: "42 mins ago" }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                            <div>
                                <p className="text-sm font-medium text-card-foreground">{item.alert}</p>
                                <p className="text-xs text-muted-foreground">{item.loc} • {item.time}</p>
                            </div>
                        </div>
                        <button className="text-xs text-primary hover:underline font-medium">View Details</button>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
