"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  eventTypes: string[]
  selectedFilters: string[]
  setSelectedFilters: (filters: string[]) => void
}

export default function FilterPanel({ eventTypes, selectedFilters, setSelectedFilters }: FilterPanelProps) {
  const toggleFilter = (type: string) => {
    if (selectedFilters.includes(type)) {
      setSelectedFilters(selectedFilters.filter((t) => t !== type))
    } else {
      setSelectedFilters([...selectedFilters, type])
    }
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

  return (
    <motion.div className="border rounded-lg p-4 bg-card" layout>
      <div className="mb-2 text-sm font-medium">Filter by event type:</div>
      <div className="flex flex-wrap gap-2">
        {eventTypes.map((type) => (
          <Badge
            key={type}
            variant="outline"
            className={cn(
              "cursor-pointer transition-all flex items-center gap-1 py-1 px-3",
              selectedFilters.includes(type) ? "bg-primary/10 border-primary" : "hover:bg-muted",
            )}
            onClick={() => toggleFilter(type)}
          >
            <div className={cn("w-2 h-2 rounded-full", getEventTypeColor(type))} />
            {type}
            {selectedFilters.includes(type) && <Check className="h-3 w-3 ml-1" />}
          </Badge>
        ))}

        {selectedFilters.length > 0 && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-muted py-1 px-3"
            onClick={() => setSelectedFilters([])}
          >
            Clear all
          </Badge>
        )}
      </div>
    </motion.div>
  )
}
