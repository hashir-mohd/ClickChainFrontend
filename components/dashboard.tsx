"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, RefreshCw, ChevronDown, ChevronUp, Clock, Activity } from "lucide-react"
import Timeline from "@/components/timeline"
import LogDetails from "@/components/log-details"
import FilterPanel from "@/components/filter-panel"
import NetworkGraph from "@/components/network-graph"
import NetworkGraphTimeline from "@/components/network-graph-timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useLogs } from "@/hooks/use-logs"

export default function Dashboard() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [view, setView] = useState<"timeline" | "graph" | "graph-timeline">("timeline")
  const [isPolling, setIsPolling] = useState(true)
  const [pollingInterval, setPollingInterval] = useState(5000)

  const { logs, isLoading, error, mutate } = useLogs(isPolling, pollingInterval)

  useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching logs",
        description: "Could not connect to the logs server. Please try again.",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const filteredLogs = logs
    ? logs.filter((log) => {
        // Apply search filter
        const searchLower = searchQuery.toLowerCase()
        const urlMatch = log.data.url && log.data.url.toLowerCase().includes(searchLower)
        const typeMatch = log.type.toLowerCase().includes(searchLower)
        const methodMatch = log.data.method && log.data.method.toLowerCase().includes(searchLower)

        const searchMatches = searchQuery === "" || urlMatch || typeMatch || methodMatch

        // Apply type filters
        const typeFilterMatches = selectedFilters.length === 0 || selectedFilters.includes(log.type)

        return searchMatches && typeFilterMatches
      })
    : []

  const handleRefresh = () => {
    mutate()
    toast({
      title: "Refreshed",
      description: "Log data has been refreshed",
    })
  }

  const togglePolling = () => {
    setIsPolling(!isPolling)
    toast({
      title: isPolling ? "Polling stopped" : "Polling started",
      description: isPolling
        ? "Real-time updates have been disabled"
        : `Real-time updates enabled (every ${pollingInterval / 1000}s)`,
    })
  }

  const uniqueEventTypes = logs ? [...new Set(logs.map((log) => log.type))] : []

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              API Logs Visualizer
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={togglePolling} className={isPolling ? "bg-primary/10" : ""}>
                <Clock className="h-4 w-4 mr-2" />
                {isPolling ? "Live" : "Paused"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex-1 flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by URL, type, or method..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Tabs defaultValue="timeline" className="hidden sm:flex">
            <TabsList>
              <TabsTrigger
                value="timeline"
                onClick={() => setView("timeline")}
                className={view === "timeline" ? "bg-primary/10" : ""}
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="graph"
                onClick={() => setView("graph")}
                className={view === "graph" ? "bg-primary/10" : ""}
              >
                Network Graph
              </TabsTrigger>
              <TabsTrigger
                value="graph-timeline"
                onClick={() => setView("graph-timeline")}
                className={view === "graph-timeline" ? "bg-primary/10" : ""}
              >
                Graph Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-4"
            >
              <FilterPanel
                eventTypes={uniqueEventTypes}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:hidden mb-4">
          <Tabs defaultValue="timeline">
            <TabsList className="w-full">
              <TabsTrigger value="timeline" onClick={() => setView("timeline")} className="flex-1">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="graph" onClick={() => setView("graph")} className="flex-1">
                Network Graph
              </TabsTrigger>
              <TabsTrigger value="graph-timeline" onClick={() => setView("graph-timeline")} className="flex-1">
                Graph Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex-1 overflow-hidden flex flex-col"
          >
            {view === "timeline" ? (
              <Timeline
                logs={filteredLogs}
                isLoading={isLoading}
                onSelectLog={setSelectedLog}
                selectedLog={selectedLog}
              />
            ) : view === "graph" ? (
              <NetworkGraph logs={filteredLogs} onSelectLog={setSelectedLog} />
            ) : (
              <NetworkGraphTimeline logs={filteredLogs} onSelectLog={setSelectedLog} />
            )}
          </motion.div>

          {selectedLog && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full sm:w-2/5 lg:w-1/3 border rounded-lg overflow-hidden flex flex-col"
            >
              <LogDetails log={selectedLog} onClose={() => setSelectedLog(null)} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
