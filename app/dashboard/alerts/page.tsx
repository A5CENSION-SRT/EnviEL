"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Alert {
  id: number
  created_at: string
  type: string
  location: string
  status: string
}

export default function AlertsPage() {
  // Mock data for Bandipur
  const [alerts] = useState<Alert[]>(() => [
    { id: 101, created_at: new Date().toISOString(), type: 'chainsaw', location: 'Moyar River Bank', status: 'Investigating' },
    { id: 102, created_at: new Date(Date.now() - 1800000).toISOString(), type: 'vehicle', location: 'Gundlupet Buffer Zone', status: 'Resolved' },
    { id: 103, created_at: new Date(Date.now() - 3600000).toISOString(), type: 'gunshot', location: 'Kekkanhalla Checkpost', status: 'Critical' },
    { id: 104, created_at: new Date(Date.now() - 7200000).toISOString(), type: 'movement', location: 'Omkar Range', status: 'Monitored' },
  ])
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="rounded-md border border-border bg-card shadow-sm">
        <Table>
          <TableCaption>A list of recent security alerts in Bandipur National Park.</TableCaption>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Time</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No alerts found.</TableCell>
                </TableRow>
            ) : (
                alerts.map((alert) => (
                <TableRow key={alert.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">{alert.id}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                            alert.type === 'chainsaw' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                            alert.type === 'gunshot' ? 'bg-red-100 text-red-700 border border-red-200' : 
                            'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                            {alert.type.toUpperCase()}
                        </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{alert.location}</TableCell>
                    <TableCell className="text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-full ${alert.status === 'Critical' ? 'bg-destructive' : 'bg-primary'}`}></span>
                            {alert.status}
                        </span>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
