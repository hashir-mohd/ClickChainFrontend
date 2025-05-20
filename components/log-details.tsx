"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, ChevronDown, ChevronUp, Clock, FileJson } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LogDetailsProps {
  log: any
  onClose: () => void
}

export default function LogDetails({ log, onClose }: LogDetailsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    headers: false,
    responseHeaders: false,
    requestBody: false,
    responseBody: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const isNetworkRequest = log.type === "network-request"

  const formatJson = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch (e) {
      return jsonString
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500"
    if (status >= 300 && status < 400) return "text-blue-500"
    if (status >= 400 && status < 500) return "text-yellow-500"
    if (status >= 500) return "text-red-500"
    return "text-gray-500"
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full"
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Log Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{log.type}</Badge>
              {isNetworkRequest && log.data.method && (
                <Badge className={getMethodColor(log.data.method)}>{log.data.method}</Badge>
              )}
            </div>

            {isNetworkRequest && <h2 className="text-lg font-medium break-all">{log.data.url}</h2>}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(log.timestamp), "PPpp")}</span>
              <span className="text-xs">({formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })})</span>
            </div>

            {isNetworkRequest && log.data.status && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <span className={cn("font-medium", getStatusColor(log.data.status))}>
                  {log.data.status} {log.data.statusText}
                </span>
              </div>
            )}

            {isNetworkRequest && log.data.time && (
              <div className="text-sm">
                Duration: <span className="font-medium">{log.data.time.toFixed(2)}ms</span>
              </div>
            )}
          </div>

          {isNetworkRequest ? (
            <Tabs defaultValue="request">
              <TabsList className="w-full">
                <TabsTrigger value="request" className="flex-1">
                  Request
                </TabsTrigger>
                <TabsTrigger value="response" className="flex-1">
                  Response
                </TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4 mt-4">
                {log.data.headers && log.data.headers.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("headers")}
                      className="flex items-center justify-between w-full"
                    >
                      <span>Headers ({log.data.headers.length})</span>
                      {expandedSections.headers ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedSections.headers && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-md p-3 bg-muted/30 space-y-1"
                      >
                        {log.data.headers.map((header: any, index: number) => (
                          <div key={index} className="grid grid-cols-3 text-sm">
                            <span className="font-medium truncate">{header.name}:</span>
                            <span className="col-span-2 break-all">{header.value}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {log.data.postData && (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("requestBody")}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        <span>Request Body</span>
                      </div>
                      {expandedSections.requestBody ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedSections.requestBody && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-md p-3 bg-muted/30"
                      >
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">{formatJson(log.data.postData)}</pre>
                      </motion.div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="response" className="space-y-4 mt-4">
                {log.data.responseHeaders && log.data.responseHeaders.length > 0 && (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("responseHeaders")}
                      className="flex items-center justify-between w-full"
                    >
                      <span>Response Headers ({log.data.responseHeaders.length})</span>
                      {expandedSections.responseHeaders ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedSections.responseHeaders && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-md p-3 bg-muted/30 space-y-1"
                      >
                        {log.data.responseHeaders.map((header: any, index: number) => (
                          <div key={index} className="grid grid-cols-3 text-sm">
                            <span className="font-medium truncate">{header.name}:</span>
                            <span className="col-span-2 break-all">{header.value}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {log.data.responseBody && (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection("responseBody")}
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        <span>Response Body</span>
                      </div>
                      {expandedSections.responseBody ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {expandedSections.responseBody && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border rounded-md p-3 bg-muted/30"
                      >
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                          {formatJson(log.data.responseBody)}
                        </pre>
                      </motion.div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : log.type === "click" ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-muted/30">
                <h3 className="font-medium mb-2">Click Event Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="font-medium">Element:</span>
                    <span className="col-span-2">{log.data.tag}</span>
                  </div>
                  {log.data.id && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="font-medium">ID:</span>
                      <span className="col-span-2">{log.data.id}</span>
                    </div>
                  )}
                  {log.data.class && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="font-medium">Class:</span>
                      <span className="col-span-2">{log.data.class}</span>
                    </div>
                  )}
                  {log.data.text && (
                    <div className="grid grid-cols-3 text-sm">
                      <span className="font-medium">Text:</span>
                      <span className="col-span-2">{log.data.text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border rounded-md p-4 bg-muted/30">
              <h3 className="font-medium mb-2">Event Data</h3>
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
            </div>
          )}

          <div className="border rounded-md p-4 bg-muted/30">
            <h3 className="font-medium mb-2">Timing</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 text-sm">
                <span className="font-medium">Created:</span>
                <span className="col-span-2">{format(new Date(log.timestamp), "PPpp")}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="font-medium">Received:</span>
                <span className="col-span-2">{format(new Date(log.receivedAt), "PPpp")}</span>
              </div>
              <div className="grid grid-cols-3 text-sm">
                <span className="font-medium">Latency:</span>
                <span className="col-span-2">
                  {(new Date(log.receivedAt).getTime() - new Date(log.timestamp).getTime()).toFixed(2)}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  )
}
