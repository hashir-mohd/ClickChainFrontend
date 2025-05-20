"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  Globe,
  MousePointer,
  Keyboard,
  AlertTriangle,
  Server,
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Clock,
  Calendar,
} from "lucide-react"
import dynamic from "next/dynamic"
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false })
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface NetworkGraphTimelineProps {
  logs: any[]
  onSelectLog: (log: any) => void
}

export default function NetworkGraphTimeline({ logs, onSelectLog }: NetworkGraphTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [graphData, setGraphData] = useState<any>({ nodes: [], links: [] })
  const [hoveredNode, setHoveredNode] = useState<any>(null)
  const [hoveredLink, setHoveredLink] = useState<any>(null)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [timelinePosition, setTimelinePosition] = useState(0) // 0-100
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1x, 2x, 4x
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showNodeDetails, setShowNodeDetails] = useState(false)
  const [groupedByDomain, setGroupedByDomain] = useState(true)
  const [filteredEventTypes, setFilteredEventTypes] = useState<string[]>([])
  const [currentTimestamp, setCurrentTimestamp] = useState<Date | null>(null)
  const [timelineMarkers, setTimelineMarkers] = useState<number[]>([])
  const [eventCounts, setEventCounts] = useState<{ total: number; visible: number }>({ total: 0, visible: 0 })

  // Get all unique event types
  const eventTypes = useMemo(() => {
    if (!logs.length) return []
    return [...new Set(logs.map((log) => log.type))]
  }, [logs])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateDimensions)
      updateDimensions()
      return () => window.removeEventListener("resize", updateDimensions)
    }
  }, [])

  // Process logs into graph data
  useEffect(() => {
    if (!logs.length) return

    const nodes: any[] = []
    const links: any[] = []
    const nodeMap = new Map()
    const domains = new Map()
    const timestamps: number[] = []

    // First pass: create domain nodes and collect all logs
    logs.forEach((log) => {
      if (log.type === "network-request" && log.data.url) {
        try {
          const urlParts = new URL(log.data.url)
          const domain = urlParts.hostname

          if (!domains.has(domain)) {
            domains.set(domain, {
              id: domain,
              name: domain,
              type: "domain",
              val: 8,
              color: "#4299e1", // blue
              icon: "globe",
              endpoints: [],
              x: Math.random() * 500,
              y: Math.random() * 500,
            })
          }

          // Add this endpoint to the domain's list
          const domainNode = domains.get(domain)
          domainNode.endpoints.push(log)
        } catch (e) {
          console.error("Invalid URL:", log.data.url)
        }
      }

      // Collect timestamps for timeline markers
      const timestamp = new Date(log.timestamp).getTime()
      timestamps.push(timestamp)
    })

    // Add domain nodes to the graph
    domains.forEach((domain) => {
      nodes.push(domain)
      nodeMap.set(domain.id, domain)
    })

    // Second pass: create event nodes and links
    logs.forEach((log, index) => {
      const nodeId = `${log.type}-${index}`
      let nodeColor = "#718096" // default gray
      let nodeIcon = "info"
      let nodeSize = 4

      if (log.type === "network-request") {
        try {
          const urlParts = new URL(log.data.url)
          const domain = urlParts.hostname
          const path = urlParts.pathname

          // Set color based on status code
          if (log.data.status) {
            if (log.data.status >= 200 && log.data.status < 300)
              nodeColor = "#48bb78" // green
            else if (log.data.status >= 300 && log.data.status < 400)
              nodeColor = "#4299e1" // blue
            else if (log.data.status >= 400 && log.data.status < 500)
              nodeColor = "#ecc94b" // yellow
            else if (log.data.status >= 500) nodeColor = "#f56565" // red
          }

          // Set icon based on method
          if (log.data.method === "GET") nodeIcon = "server"
          else if (log.data.method === "POST") nodeIcon = "server"
          else if (log.data.method === "OPTIONS") nodeIcon = "server"
          else nodeIcon = "server"

          // Set size based on importance/time
          nodeSize = 5 + (log.data.time ? Math.min(log.data.time / 200, 5) : 0)

          // Create the node
          const endpointNode = {
            id: nodeId,
            name: path || "/",
            fullUrl: log.data.url,
            domain: domain,
            type: "endpoint",
            eventType: log.type,
            method: log.data.method,
            status: log.data.status,
            val: nodeSize,
            color: nodeColor,
            icon: nodeIcon,
            log: log,
            timestamp: new Date(log.timestamp).getTime(),
            x: domains.get(domain).x + (Math.random() * 100 - 50),
            y: domains.get(domain).y + (Math.random() * 100 - 50),
            // Add animation properties
            opacity: 0,
            visible: false,
          }

          nodes.push(endpointNode)
          nodeMap.set(nodeId, endpointNode)

          // Link endpoint to domain
          links.push({
            source: domain,
            target: nodeId,
            value: 1,
            type: "domain-endpoint",
            dashed: log.data.method === "OPTIONS",
            color: nodeColor,
            curvature: 0.1,
            timestamp: new Date(log.timestamp).getTime(),
            // Add animation properties
            opacity: 0,
            visible: false,
          })
        } catch (e) {
          console.error("Invalid URL:", log.data.url)
        }
      } else if (log.type === "click") {
        nodeColor = "#48bb78" // green
        nodeIcon = "mousePointer"

        const clickNode = {
          id: nodeId,
          name: `Click: ${log.data.tag} ${log.data.id ? `#${log.data.id}` : ""}`,
          type: "event",
          eventType: log.type,
          val: 4,
          color: nodeColor,
          icon: nodeIcon,
          log: log,
          timestamp: new Date(log.timestamp).getTime(),
          x: Math.random() * 500,
          y: Math.random() * 500,
          // Add animation properties
          opacity: 0,
          visible: false,
        }

        nodes.push(clickNode)
        nodeMap.set(nodeId, clickNode)
      } else if (log.type === "keydown") {
        nodeColor = "#805ad5" // purple
        nodeIcon = "keyboard"

        const keyNode = {
          id: nodeId,
          name: `Key: ${log.data.key}`,
          type: "event",
          eventType: log.type,
          val: 4,
          color: nodeColor,
          icon: nodeIcon,
          log: log,
          timestamp: new Date(log.timestamp).getTime(),
          x: Math.random() * 500,
          y: Math.random() * 500,
          // Add animation properties
          opacity: 0,
          visible: false,
        }

        nodes.push(keyNode)
        nodeMap.set(nodeId, keyNode)
      } else if (log.type === "error") {
        nodeColor = "#f56565" // red
        nodeIcon = "alertTriangle"

        const errorNode = {
          id: nodeId,
          name: `Error: ${log.data.message}`,
          type: "event",
          eventType: log.type,
          val: 5,
          color: nodeColor,
          icon: nodeIcon,
          log: log,
          timestamp: new Date(log.timestamp).getTime(),
          x: Math.random() * 500,
          y: Math.random() * 500,
          // Add animation properties
          opacity: 0,
          visible: false,
        }

        nodes.push(errorNode)
        nodeMap.set(nodeId, errorNode)
      } else {
        // Generic event node
        const eventNode = {
          id: nodeId,
          name: `${log.type} event`,
          type: "event",
          eventType: log.type,
          val: 3,
          color: nodeColor,
          icon: nodeIcon,
          log: log,
          timestamp: new Date(log.timestamp).getTime(),
          x: Math.random() * 500,
          y: Math.random() * 500,
          // Add animation properties
          opacity: 0,
          visible: false,
        }

        nodes.push(eventNode)
        nodeMap.set(nodeId, eventNode)
      }
    })

    // Create links between events based on time sequence and causality
    for (let i = 0; i < logs.length - 1; i++) {
      const currentLog = logs[i]
      const nextLog = logs[i + 1]

      const currentNodeId = `${currentLog.type}-${i}`
      const nextNodeId = `${nextLog.type}-${i + 1}`

      // Only link if both nodes exist
      if (nodeMap.has(currentNodeId) && nodeMap.has(nextNodeId)) {
        const timeDiff = new Date(nextLog.timestamp).getTime() - new Date(currentLog.timestamp).getTime()

        // If events are close in time (within 2 seconds), create a link
        if (timeDiff < 2000) {
          // Determine if this is likely a causal relationship
          let isCausal = false
          let linkLabel = ""

          // Click or keydown followed by network request is likely causal
          if ((currentLog.type === "click" || currentLog.type === "keydown") && nextLog.type === "network-request") {
            isCausal = true
            linkLabel = "Triggered"
          }

          // Network request followed by another network request might be related
          else if (currentLog.type === "network-request" && nextLog.type === "network-request") {
            // Check if URLs are related
            try {
              const currentUrl = new URL(currentLog.data.url)
              const nextUrl = new URL(nextLog.data.url)

              if (currentUrl.hostname === nextUrl.hostname) {
                isCausal = true
                linkLabel = "Related"
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }

          // Create the link
          links.push({
            source: currentNodeId,
            target: nextNodeId,
            value: isCausal ? 2 : 1,
            type: isCausal ? "causal" : "temporal",
            label: linkLabel,
            dashed: !isCausal,
            color: isCausal ? "#4299e1" : "#a0aec0",
            curvature: isCausal ? 0.3 : 0.1,
            timestamp: new Date(currentLog.timestamp).getTime(),
            // Add animation properties
            opacity: 0,
            visible: false,
          })
        }
      }
    }

    // Calculate timeline markers
    if (timestamps.length > 0) {
      const minTime = Math.min(...timestamps)
      const maxTime = Math.max(...timestamps)

      // Create 5 evenly spaced markers
      const markers = []
      for (let i = 0; i <= 4; i++) {
        markers.push(minTime + ((maxTime - minTime) * i) / 4)
      }
      setTimelineMarkers(markers)
    }

    setGraphData({ nodes, links })
    setEventCounts({ total: nodes.filter((n) => n.type !== "domain").length, visible: 0 })

    // Reset timeline position when data changes
    setTimelinePosition(0)
    updateVisibleNodesAndLinks(0, { nodes, links })
  }, [logs])

  // Update visible nodes and links based on timeline position
  const updateVisibleNodesAndLinks = (position: number, data = graphData) => {
    if (!data.nodes.length) return

    // Get the time range of all events
    const allTimestamps = data.nodes
      .filter((node) => node.timestamp && node.type !== "domain")
      .map((node) => node.timestamp)

    if (allTimestamps.length === 0) return

    const minTime = Math.min(...allTimestamps)
    const maxTime = Math.max(...allTimestamps)
    const timeRange = maxTime - minTime

    // Calculate the cutoff time based on timeline position
    const cutoffTime = minTime + timeRange * (position / 100)
    setCurrentTimestamp(new Date(cutoffTime))

    // Count visible events
    let visibleCount = 0

    // Update node visibility
    data.nodes.forEach((node) => {
      // Domain nodes are always visible
      if (node.type === "domain") {
        node.visible = true
        node.opacity = 1
        return
      }

      // Check if node should be visible based on timestamp
      const shouldBeVisible = node.timestamp && node.timestamp <= cutoffTime

      // If filtered by event type, check that too
      const passesEventTypeFilter =
        filteredEventTypes.length === 0 || !node.eventType || filteredEventTypes.includes(node.eventType)

      node.visible = shouldBeVisible && passesEventTypeFilter

      // Animate opacity
      if (node.visible) {
        node.opacity = 1
        visibleCount++
      } else {
        node.opacity = 0
      }
    })

    // Update link visibility
    data.links.forEach((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target

      // Find the source and target nodes
      const sourceNode = data.nodes.find((n) => n.id === sourceId)
      const targetNode = data.nodes.find((n) => n.id === targetId)

      // Link is visible if both source and target are visible
      link.visible = sourceNode?.visible && targetNode?.visible

      // Animate opacity
      if (link.visible) {
        link.opacity = 1
      } else {
        link.opacity = 0
      }
    })

    setEventCounts({ total: data.nodes.filter((n) => n.type !== "domain").length, visible: visibleCount })
  }

  // Timeline animation
  useEffect(() => {
    if (!isPlaying || !graphData.nodes.length) return

    const interval = setInterval(() => {
      setTimelinePosition((prev) => {
        if (prev >= 100) {
          setIsPlaying(false)
          return 100
        }
        const increment = playbackSpeed * 0.5
        return Math.min(prev + increment, 100)
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isPlaying, graphData.nodes.length, playbackSpeed])

  // Update visible nodes when timeline position changes
  useEffect(() => {
    updateVisibleNodesAndLinks(timelinePosition)
  }, [timelinePosition, filteredEventTypes])

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Handle zoom
  const handleZoom = (direction: "in" | "out") => {
    if (!graphRef.current) return

    if (direction === "in") {
      setZoomLevel((prev) => Math.min(prev + 0.2, 3))
      graphRef.current.zoom(zoomLevel + 0.2)
    } else {
      setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
      graphRef.current.zoom(zoomLevel - 0.2)
    }
  }

  // Handle node click
  const handleNodeClick = (node: any) => {
    if (node.log) {
      onSelectLog(node.log)
      setSelectedNode(node)
      setShowNodeDetails(true)
    }
  }

  // Get related nodes for highlighting
  const getRelatedNodes = (nodeId: string) => {
    const relatedNodeIds = new Set([nodeId])

    // Add all directly connected nodes
    graphData.links.forEach((link) => {
      const sourceId = typeof link.source === "object" ? link.source.id : link.source
      const targetId = typeof link.target === "object" ? link.target.id : link.target

      if (sourceId === nodeId) relatedNodeIds.add(targetId)
      if (targetId === nodeId) relatedNodeIds.add(sourceId)
    })

    return relatedNodeIds
  }

  // Toggle grouping by domain
  const toggleGrouping = () => {
    setGroupedByDomain(!groupedByDomain)

    if (graphRef.current) {
      // Reset the simulation
      graphRef.current.d3Force("charge").strength(groupedByDomain ? -100 : -50)
      graphRef.current.d3Force("link").distance(groupedByDomain ? 100 : 50)
      graphRef.current.d3ReheatSimulation()
    }
  }

  // Toggle event type filter
  const toggleEventTypeFilter = (eventType: string) => {
    setFilteredEventTypes((prev) =>
      prev.includes(eventType) ? prev.filter((type) => type !== eventType) : [...prev, eventType],
    )
  }

  // Change playback speed
  const cyclePlaybackSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === 1) return 2
      if (prev === 2) return 4
      return 1
    })
  }

  // Reset timeline
  const resetTimeline = () => {
    setTimelinePosition(0)
    setIsPlaying(false)
  }

  // Jump to end of timeline
  const jumpToEnd = () => {
    setTimelinePosition(100)
    setIsPlaying(false)
  }

  // Render node with custom icon
  const renderNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const { x, y, val, color, icon, id, opacity } = node

    // Skip rendering if node is not visible
    if (!node.visible) return

    const size = val || 5
    const fontSize = 12 / globalScale
    const isHighlighted = selectedNode && getRelatedNodes(selectedNode.id).has(id)

    // Apply opacity
    ctx.globalAlpha = opacity

    // Draw node circle
    ctx.beginPath()
    ctx.arc(x, y, size, 0, 2 * Math.PI)
    ctx.fillStyle = isHighlighted ? "#f6e05e" : color
    ctx.fill()

    // Draw icon
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw different icons based on node type
    if (icon === "globe") {
      // Draw a simple globe icon
      ctx.beginPath()
      ctx.arc(x, y, size * 0.6, 0, 2 * Math.PI)
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 1 / globalScale
      ctx.stroke()

      // Draw latitude lines
      ctx.beginPath()
      ctx.moveTo(x - size * 0.6, y)
      ctx.lineTo(x + size * 0.6, y)
      ctx.stroke()

      // Draw longitude lines
      ctx.beginPath()
      ctx.moveTo(x, y - size * 0.6)
      ctx.lineTo(x, y + size * 0.6)
      ctx.stroke()
    } else if (icon === "mousePointer") {
      // Draw a simple mouse pointer
      ctx.fillText("👆", x, y)
    } else if (icon === "keyboard") {
      // Draw a keyboard icon
      ctx.fillText("⌨️", x, y)
    } else if (icon === "alertTriangle") {
      // Draw an alert triangle
      ctx.fillText("⚠️", x, y)
    } else if (icon === "server") {
      // Draw a server icon based on method
      ctx.fillText("API", x, y)
    } else {
      // Default icon
      ctx.fillText("•", x, y)
    }

    // Draw label for domain nodes or highlighted nodes
    if (node.type === "domain" || isHighlighted || globalScale > 1.5) {
      const label = node.name
      ctx.font = `${fontSize}px Sans-Serif`
      ctx.fillStyle = "#2d3748"
      ctx.fillText(label, x, y + size + fontSize)
    }

    // Draw highlight ring for selected node
    if (selectedNode && selectedNode.id === id) {
      ctx.beginPath()
      ctx.arc(x, y, size + 2 / globalScale, 0, 2 * Math.PI)
      ctx.strokeStyle = "#f6ad55"
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()
    }

    // Reset opacity
    ctx.globalAlpha = 1
  }

  // Render link with custom style
  const renderLink = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Skip rendering if link is not visible
    if (!link.visible) return

    const start = link.source
    const end = link.target

    // Apply opacity
    ctx.globalAlpha = link.opacity

    // Calculate the direction vector
    const dx = end.x - start.x
    const dy = end.y - start.y

    // Calculate the distance
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Normalize the direction vector
    const nx = dx / distance
    const ny = dy / distance

    // Set line style
    if (link.dashed) {
      ctx.setLineDash([2 / globalScale, 2 / globalScale])
    } else {
      ctx.setLineDash([])
    }

    ctx.strokeStyle = link.color || "#a0aec0"
    ctx.lineWidth = (link.value || 1) / globalScale

    // Draw the line
    ctx.beginPath()

    if (link.curvature) {
      // Draw curved line
      const curvature = link.curvature
      const curveX = (start.x + end.x) / 2 - curvature * (end.y - start.y)
      const curveY = (start.y + end.y) / 2 + curvature * (end.x - start.x)

      ctx.moveTo(start.x, start.y)
      ctx.quadraticCurveTo(curveX, curveY, end.x, end.y)
    } else {
      // Draw straight line
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
    }

    ctx.stroke()

    // Draw arrow at the end
    const arrowLength = 8 / globalScale
    const arrowWidth = 4 / globalScale

    // Calculate arrow position (slightly before the end)
    const arrowPos = 0.9
    const arrowX = start.x + dx * arrowPos
    const arrowY = start.y + dy * arrowPos

    // Draw arrow
    ctx.beginPath()
    ctx.moveTo(arrowX - nx * arrowLength - ny * arrowWidth, arrowY - ny * arrowLength + nx * arrowWidth)
    ctx.lineTo(arrowX, arrowY)
    ctx.lineTo(arrowX - nx * arrowLength + ny * arrowWidth, arrowY - ny * arrowLength - nx * arrowWidth)
    ctx.fillStyle = link.color || "#a0aec0"
    ctx.fill()

    // Draw label if it exists and zoom level is high enough
    if (link.label && globalScale > 1.2) {
      const labelX = (start.x + end.x) / 2
      const labelY = (start.y + end.y) / 2

      ctx.font = `${10 / globalScale}px Sans-Serif`
      ctx.fillStyle = "#4a5568"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      // Draw background for better readability
      const textWidth = ctx.measureText(link.label).width
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
      ctx.fillRect(
        labelX - textWidth / 2 - 2 / globalScale,
        labelY - 6 / globalScale,
        textWidth + 4 / globalScale,
        12 / globalScale,
      )

      ctx.fillStyle = "#4a5568"
      ctx.fillText(link.label, labelX, labelY)
    }

    // Reset line dash and opacity
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  }

  if (!logs.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No logs found for network graph</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-hidden flex flex-col" ref={containerRef}>
        <div className="p-2 border-b flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleGrouping}>
              {groupedByDomain ? "Ungroup Nodes" : "Group by Domain"}
            </Button>

            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => handleZoom("out")}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleZoom("in")}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by type:</span>
            {eventTypes.map((type) => (
              <Badge
                key={type}
                variant={filteredEventTypes.includes(type) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleEventTypeFilter(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex-1 relative">
          {graphData.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              width={dimensions.width}
              height={dimensions.height - 120} // Subtract height of controls and timeline
              nodeLabel={null} // We'll use custom tooltips
              linkLabel={null}
              nodeCanvasObject={renderNode}
              linkCanvasObject={renderLink}
              onNodeClick={handleNodeClick}
              onNodeHover={setHoveredNode}
              onLinkHover={setHoveredLink}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              d3Force={groupedByDomain ? "charge" : null}
              onEngineStop={() => {
                // After initial layout, reduce the physics simulation
                if (graphRef.current) {
                  graphRef.current.d3Force("charge").strength(groupedByDomain ? -100 : -50)
                  graphRef.current.d3Force("link").distance(groupedByDomain ? 100 : 50)
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Node tooltip */}
          <AnimatePresence>
            {hoveredNode && !showNodeDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bg-white p-2 rounded-md shadow-lg border text-sm z-10"
                style={{
                  left: `${Math.min(dimensions.width - 200, hoveredNode.x + dimensions.width / 2)}px`,
                  top: `${Math.min(dimensions.height - 100, hoveredNode.y + dimensions.height / 2)}px`,
                  maxWidth: "300px",
                }}
              >
                <div className="font-medium">{hoveredNode.name}</div>

                {hoveredNode.type === "domain" && (
                  <div className="text-xs text-muted-foreground">
                    Domain with {hoveredNode.endpoints?.length || 0} endpoints
                  </div>
                )}

                {hoveredNode.type === "endpoint" && (
                  <>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className={
                          hoveredNode.method === "GET"
                            ? "bg-blue-500"
                            : hoveredNode.method === "POST"
                              ? "bg-green-500"
                              : hoveredNode.method === "OPTIONS"
                                ? "bg-yellow-500"
                                : hoveredNode.method === "DELETE"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                        }
                      >
                        {hoveredNode.method}
                      </Badge>

                      {hoveredNode.status && (
                        <Badge
                          variant="outline"
                          className={
                            hoveredNode.status >= 200 && hoveredNode.status < 300
                              ? "text-green-500"
                              : hoveredNode.status >= 300 && hoveredNode.status < 400
                                ? "text-blue-500"
                                : hoveredNode.status >= 400 && hoveredNode.status < 500
                                  ? "text-yellow-500"
                                  : hoveredNode.status >= 500
                                    ? "text-red-500"
                                    : "text-gray-500"
                          }
                        >
                          {hoveredNode.status}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs mt-1 truncate">{hoveredNode.fullUrl}</div>

                    {hoveredNode.log?.data.time && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Duration: {hoveredNode.log.data.time.toFixed(2)}ms
                      </div>
                    )}
                  </>
                )}

                {hoveredNode.type === "event" && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(hoveredNode.log.timestamp), "PPpp")}
                  </div>
                )}

                <div className="text-xs text-primary mt-1">Click for details</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link tooltip */}
          <AnimatePresence>
            {hoveredLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bg-white p-2 rounded-md shadow-lg border text-sm z-10"
                style={{
                  left: `${Math.min(dimensions.width - 200, (hoveredLink.source.x + hoveredLink.target.x) / 2 + dimensions.width / 2)}px`,
                  top: `${Math.min(dimensions.height - 100, (hoveredLink.source.y + hoveredLink.target.y) / 2 + dimensions.height / 2)}px`,
                  maxWidth: "250px",
                }}
              >
                <div className="font-medium">
                  {hoveredLink.type === "causal" ? "Causal Relationship" : "Temporal Sequence"}
                </div>

                <div className="text-xs mt-1">
                  From: <span className="font-medium">{hoveredLink.source.name}</span>
                </div>

                <div className="text-xs mt-1">
                  To: <span className="font-medium">{hoveredLink.target.name}</span>
                </div>

                {hoveredLink.label && <div className="text-xs text-primary mt-1">{hoveredLink.label}</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timeline controls */}
        <div className="p-4 border-t">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button variant="outline" size="sm" onClick={resetTimeline}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Start
                </Button>

                <Button variant="outline" size="sm" onClick={jumpToEnd}>
                  End
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <Button variant="outline" size="sm" onClick={cyclePlaybackSpeed}>
                  {playbackSpeed}x
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {currentTimestamp ? format(currentTimestamp, "PPp") : "No events"}
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {eventCounts.visible} / {eventCounts.total} events
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Slider
                value={[timelinePosition]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={(value) => {
                  setTimelinePosition(value[0])
                  if (isPlaying) setIsPlaying(false)
                }}
                className="w-full"
              />

              <div className="flex justify-between px-1 text-xs text-muted-foreground">
                {timelineMarkers.map((timestamp, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="h-1 w-0.5 bg-muted-foreground mb-1"></div>
                    <span>{format(new Date(timestamp), "HH:mm:ss")}</span>
                  </div>
                ))}
              </div>

              <Progress value={timelinePosition} className="h-1" />
            </div>
          </div>
        </div>
      </Card>

      {/* Node details panel */}
      <AnimatePresence>
        {showNodeDetails && selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-white z-20 flex flex-col"
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                {selectedNode.type === "domain" && <Globe className="h-4 w-4" />}
                {selectedNode.type === "endpoint" && <Server className="h-4 w-4" />}
                {selectedNode.eventType === "click" && <MousePointer className="h-4 w-4" />}
                {selectedNode.eventType === "keydown" && <Keyboard className="h-4 w-4" />}
                {selectedNode.eventType === "error" && <AlertTriangle className="h-4 w-4" />}
                {selectedNode.name}
              </h3>

              <Button variant="ghost" size="sm" onClick={() => setShowNodeDetails(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {selectedNode.type === "domain" ? (
                <div className="space-y-4">
                  <div className="text-sm">
                    <span className="font-medium">Domain:</span> {selectedNode.name}
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Endpoints:</span> {selectedNode.endpoints?.length || 0}
                  </div>

                  {selectedNode.endpoints && selectedNode.endpoints.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Endpoints:</h4>

                      {selectedNode.endpoints.map((endpoint: any, index: number) => (
                        <div key={index} className="border rounded-md p-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                endpoint.data.method === "GET"
                                  ? "bg-blue-500"
                                  : endpoint.data.method === "POST"
                                    ? "bg-green-500"
                                    : endpoint.data.method === "PUT"
                                      ? "bg-yellow-500"
                                      : endpoint.data.method === "DELETE"
                                        ? "bg-red-500"
                                        : "bg-gray-500"
                              }
                            >
                              {endpoint.data.method}
                            </Badge>

                            {endpoint.data.status && (
                              <Badge
                                variant="outline"
                                className={
                                  endpoint.data.status >= 200 && endpoint.data.status < 300
                                    ? "text-green-500"
                                    : endpoint.data.status >= 300 && endpoint.data.status < 400
                                      ? "text-blue-500"
                                      : endpoint.data.status >= 400 && endpoint.data.status < 500
                                        ? "text-yellow-500"
                                        : endpoint.data.status >= 500
                                          ? "text-red-500"
                                          : "text-gray-500"
                                }
                              >
                                {endpoint.data.status}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-1 truncate">{new URL(endpoint.data.url).pathname}</div>

                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-1"
                            onClick={() => {
                              onSelectLog(endpoint)
                              setSelectedNode({
                                ...selectedNode,
                                log: endpoint,
                              })
                            }}
                          >
                            View details
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : selectedNode.log ? (
                <div className="space-y-4">
                  {/* Basic info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{selectedNode.log.type}</Badge>

                      {selectedNode.log.type === "network-request" && selectedNode.log.data.method && (
                        <Badge
                          className={
                            selectedNode.log.data.method === "GET"
                              ? "bg-blue-500"
                              : selectedNode.log.data.method === "POST"
                                ? "bg-green-500"
                                : selectedNode.log.data.method === "PUT"
                                  ? "bg-yellow-500"
                                  : selectedNode.log.data.method === "DELETE"
                                    ? "bg-red-500"
                                    : "bg-gray-500"
                          }
                        >
                          {selectedNode.log.data.method}
                        </Badge>
                      )}

                      {selectedNode.log.type === "network-request" && selectedNode.log.data.status && (
                        <Badge
                          variant="outline"
                          className={
                            selectedNode.log.data.status >= 200 && selectedNode.log.data.status < 300
                              ? "text-green-500"
                              : selectedNode.log.data.status >= 300 && selectedNode.log.data.status < 400
                                ? "text-blue-500"
                                : selectedNode.log.data.status >= 400 && selectedNode.log.data.status < 500
                                  ? "text-yellow-500"
                                  : selectedNode.log.data.status >= 500
                                    ? "text-red-500"
                                    : "text-gray-500"
                          }
                        >
                          {selectedNode.log.data.status} {selectedNode.log.data.statusText}
                        </Badge>
                      )}
                    </div>

                    {selectedNode.log.type === "network-request" && (
                      <div className="text-sm font-medium break-all">{selectedNode.log.data.url}</div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedNode.log.timestamp), "PPpp")}
                    </div>

                    {selectedNode.log.type === "network-request" && selectedNode.log.data.time && (
                      <div className="text-sm">
                        Duration: <span className="font-medium">{selectedNode.log.data.time.toFixed(2)}ms</span>
                      </div>
                    )}
                  </div>

                  {/* Related nodes */}
                  <div className="border rounded-md p-3 space-y-2">
                    <h4 className="text-sm font-medium">Related Events</h4>

                    <div className="space-y-1">
                      {Array.from(getRelatedNodes(selectedNode.id)).map((nodeId) => {
                        if (nodeId === selectedNode.id) return null

                        const node = graphData.nodes.find((n: any) => n.id === nodeId)
                        if (!node) return null

                        return (
                          <div
                            key={nodeId}
                            className="flex items-center justify-between text-sm p-1 hover:bg-muted rounded"
                          >
                            <div className="flex items-center gap-2">
                              {node.type === "domain" && <Globe className="h-4 w-4" />}
                              {node.type === "endpoint" && <Server className="h-4 w-4" />}
                              {node.eventType === "click" && <MousePointer className="h-4 w-4" />}
                              {node.eventType === "keydown" && <Keyboard className="h-4 w-4" />}
                              {node.eventType === "error" && <AlertTriangle className="h-4 w-4" />}
                              <span className="truncate max-w-[200px]">{node.name}</span>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (node.log) {
                                  onSelectLog(node.log)
                                  setSelectedNode(node)
                                }
                              }}
                            >
                              View
                            </Button>
                          </div>
                        )
                      })}

                      {getRelatedNodes(selectedNode.id).size <= 1 && (
                        <div className="text-sm text-muted-foreground">No related events found</div>
                      )}
                    </div>
                  </div>

                  {/* Event specific details */}
                  {selectedNode.log.type === "network-request" ? (
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
                        {/* Headers */}
                        {selectedNode.log.data.headers && selectedNode.log.data.headers.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Headers</h4>

                            <div className="border rounded-md p-3 bg-muted/30 space-y-1">
                              {selectedNode.log.data.headers.map((header: any, index: number) => (
                                <div key={index} className="grid grid-cols-3 text-sm">
                                  <span className="font-medium truncate">{header.name}:</span>
                                  <span className="col-span-2 break-all">{header.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request body */}
                        {selectedNode.log.data.postData && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Request Body</h4>

                            <div className="border rounded-md p-3 bg-muted/30">
                              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(selectedNode.log.data.postData), null, 2)
                                  } catch (e) {
                                    return selectedNode.log.data.postData
                                  }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="response" className="space-y-4 mt-4">
                        {/* Response headers */}
                        {selectedNode.log.data.responseHeaders && selectedNode.log.data.responseHeaders.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Response Headers</h4>

                            <div className="border rounded-md p-3 bg-muted/30 space-y-1">
                              {selectedNode.log.data.responseHeaders.map((header: any, index: number) => (
                                <div key={index} className="grid grid-cols-3 text-sm">
                                  <span className="font-medium truncate">{header.name}:</span>
                                  <span className="col-span-2 break-all">{header.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Response body */}
                        {selectedNode.log.data.responseBody && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Response Body</h4>

                            <div className="border rounded-md p-3 bg-muted/30">
                              <pre className="text-xs overflow-auto whitespace-pre-wrap">
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(selectedNode.log.data.responseBody), null, 2)
                                  } catch (e) {
                                    return selectedNode.log.data.responseBody
                                  }
                                })()}
                              </pre>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  ) : selectedNode.log.type === "click" ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Click Event Details</h4>

                      <div className="border rounded-md p-3 bg-muted/30 space-y-1">
                        <div className="grid grid-cols-3 text-sm">
                          <span className="font-medium">Element:</span>
                          <span className="col-span-2">{selectedNode.log.data.tag}</span>
                        </div>

                        {selectedNode.log.data.id && (
                          <div className="grid grid-cols-3 text-sm">
                            <span className="font-medium">ID:</span>
                            <span className="col-span-2">{selectedNode.log.data.id}</span>
                          </div>
                        )}

                        {selectedNode.log.data.class && (
                          <div className="grid grid-cols-3 text-sm">
                            <span className="font-medium">Class:</span>
                            <span className="col-span-2">{selectedNode.log.data.class}</span>
                          </div>
                        )}

                        {selectedNode.log.data.text && (
                          <div className="grid grid-cols-3 text-sm">
                            <span className="font-medium">Text:</span>
                            <span className="col-span-2">{selectedNode.log.data.text}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedNode.log.type === "keydown" ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Keydown Event Details</h4>

                      <div className="border rounded-md p-3 bg-muted/30 space-y-1">
                        <div className="grid grid-cols-3 text-sm">
                          <span className="font-medium">Key:</span>
                          <span className="col-span-2">{selectedNode.log.data.key}</span>
                        </div>

                        {selectedNode.log.data.target && (
                          <>
                            <div className="grid grid-cols-3 text-sm">
                              <span className="font-medium">Target:</span>
                              <span className="col-span-2">{selectedNode.log.data.target.tag}</span>
                            </div>

                            {selectedNode.log.data.target.id && (
                              <div className="grid grid-cols-3 text-sm">
                                <span className="font-medium">Target ID:</span>
                                <span className="col-span-2">{selectedNode.log.data.target.id}</span>
                              </div>
                            )}

                            {selectedNode.log.data.target.type && (
                              <div className="grid grid-cols-3 text-sm">
                                <span className="font-medium">Target Type:</span>
                                <span className="col-span-2">{selectedNode.log.data.target.type}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : selectedNode.log.type === "error" ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Error Details</h4>

                      <div className="border rounded-md p-3 bg-muted/30 space-y-1">
                        <div className="grid grid-cols-3 text-sm">
                          <span className="font-medium">Message:</span>
                          <span className="col-span-2 text-red-500">{selectedNode.log.data.message}</span>
                        </div>

                        {selectedNode.log.data.source && (
                          <div className="grid grid-cols-3 text-sm">
                            <span className="font-medium">Source:</span>
                            <span className="col-span-2">{selectedNode.log.data.source}</span>
                          </div>
                        )}

                        {selectedNode.log.data.stack && (
                          <div className="grid grid-cols-3 text-sm">
                            <span className="font-medium">Stack:</span>
                            <pre className="col-span-2 text-xs whitespace-pre-wrap">{selectedNode.log.data.stack}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Event Data</h4>

                      <div className="border rounded-md p-3 bg-muted/30">
                        <pre className="text-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedNode.log.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Timing information */}
                  <div className="border rounded-md p-3 bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">Timing</h4>

                    <div className="space-y-1">
                      <div className="grid grid-cols-3 text-sm">
                        <span className="font-medium">Created:</span>
                        <span className="col-span-2">{format(new Date(selectedNode.log.timestamp), "PPpp")}</span>
                      </div>

                      <div className="grid grid-cols-3 text-sm">
                        <span className="font-medium">Received:</span>
                        <span className="col-span-2">{format(new Date(selectedNode.log.receivedAt), "PPpp")}</span>
                      </div>

                      <div className="grid grid-cols-3 text-sm">
                        <span className="font-medium">Latency:</span>
                        <span className="col-span-2">
                          {(
                            new Date(selectedNode.log.receivedAt).getTime() -
                            new Date(selectedNode.log.timestamp).getTime()
                          ).toFixed(2)}
                          ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">No details available for this node</div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
