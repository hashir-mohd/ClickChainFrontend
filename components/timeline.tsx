"use client"

import { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface TimelineProps {
  logs: any[]
  isLoading: boolean
  onSelectLog: (log: any) => void
  selectedLog: any | null
}

export default function Timeline({ logs, isLoading, onSelectLog, selectedLog }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs.length])

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading logs...</p>
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No logs found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500"
    if (status >= 300 && status < 400) return "bg-blue-500"
    if (status >= 400 && status < 500) return "bg-yellow-500"
    if (status >= 500) return "bg-red-500"
    return "bg-gray-500"
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "network-request":
        return "bg-blue-500"
      case "click":
        return "bg-green-500"
      case "keydown":
        return "bg-purple-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-blue-500 text-white"
      case "POST":
        return "bg-green-500 text-white"
      case "PUT":
        return "bg-yellow-500 text-white"
      case "DELETE":
        return "bg-red-500 text-white"
      case "PATCH":
        return "bg-purple-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  return (
    <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
      <div className="relative pl-8 pb-12">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        <AnimatePresence initial={false}>
          {logs.map((log, index) => {
            const isSelected = selectedLog && selectedLog.timestamp === log.timestamp
            const isNetworkRequest = log.type === "network-request"

            return (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className={cn("relative mb-4 cursor-pointer", isSelected ? "z-10" : "")}
                onClick={() => onSelectLog(log)}
              >
                {/* Timeline dot */}
                <div
                  className={cn(
                    "absolute left-3 top-1.5 w-3 h-3 rounded-full -translate-x-1.5 z-10",
                    getEventTypeColor(log.type),
                  )}
                />

                {/* Timeline card */}
                <motion.div
                  whileHover={{ scale: 1.01, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
                  className={cn("ml-4 p-3 border rounded-lg bg-card", isSelected ? "ring-2 ring-primary" : "")}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-xs", getEventTypeColor(log.type))}>
                        {log.type}
                      </Badge>

                      {isNetworkRequest && log.data.method && (
                        <Badge className={cn("text-xs", getMethodColor(log.data.method))}>{log.data.method}</Badge>
                      )}

                      {isNetworkRequest && log.data.status && (
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(log.data.status))}>
                          {log.data.status}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="mt-1">
                    {isNetworkRequest ? (
                      <div className="text-sm font-medium truncate">{log.data.url || "Unknown URL"}</div>
                    ) : log.type === "click" ? (
                      <div className="text-sm">
                        Clicked on{" "}
                        <span className="font-medium">
                          {log.data.tag} {log.data.id ? `#${log.data.id}` : ""}
                        </span>
                        {log.data.text ? ` "${log.data.text}"` : ""}
                      </div>
                    ) : (
                      <div className="text-sm">{log.type} event</div>
                    )}
                  </div>

                  {isNetworkRequest && log.data.time && (
                    <div className="mt-1 text-xs text-muted-foreground">Duration: {log.data.time.toFixed(2)}ms</div>
                  )}

                  <div className="mt-2 flex justify-end">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  )
}
