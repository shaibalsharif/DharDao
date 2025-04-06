"use client"

import React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Filter, Laptop, MapPin, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatCurrency } from "@/lib/utils"
import type { Activity } from "@/lib/types"
import { fetchActivities } from "@/lib/firebase-utils"

interface ActivityLogProps {
  userId: string
  startDate?: Date
  endDate?: Date
  activityType?: string | null
  actionType?: string | null
  relatedId?: string | null
  onResetFilters?: () => void
}

export default function ActivityLog({
  userId,
  startDate: initialStartDate,
  endDate: initialEndDate,
  activityType: initialActivityType,
  actionType: initialActionType,
  relatedId: initialRelatedId,
  onResetFilters,
}: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null)

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate)
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate)
  const [activityType, setActivityType] = useState<string | null>(initialActivityType || null)
  const [actionType, setActionType] = useState<string | null>(initialActionType || null)
  const [relatedId, setRelatedId] = useState<string | null>(initialRelatedId || null)

  // Track if filters were applied externally
  const [hasExternalFilters, setHasExternalFilters] = useState(
    !!(initialStartDate || initialEndDate || initialActivityType || initialActionType || initialRelatedId),
  )

  useEffect(() => {
    loadActivities()
  }, [userId])

  // Effect to handle external filter changes
  useEffect(() => {
    setStartDate(initialStartDate)
    setEndDate(initialEndDate)
    setActivityType(initialActivityType || null)
    setActionType(initialActionType || null)
    setRelatedId(initialRelatedId || null)

    setHasExternalFilters(
      !!(initialStartDate || initialEndDate || initialActivityType || initialActionType || initialRelatedId),
    )

    if (initialStartDate || initialEndDate || initialActivityType || initialActionType || initialRelatedId) {
      loadActivities()
    }
  }, [initialStartDate, initialEndDate, initialActivityType, initialActionType, initialRelatedId])

  const loadActivities = async (reset = true) => {
    if (reset) {
      setLoading(true)
    }

    try {
      const filters = {
        startDate,
        endDate,
        type: activityType || undefined,
        action: actionType || undefined,
        relatedId: relatedId || undefined,
      }

      const result = await fetchActivities(userId, filters, 20, reset ? undefined : lastDoc)

      if (reset) {
        setActivities(result.activities)
      } else {
        setActivities((prev) => [...prev, ...result.activities])
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.activities.length === 20)
    } catch (error) {
      console.error("Error loading activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    setIsFilterOpen(false)
    loadActivities()
  }

  const resetFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setActivityType(null)
    setActionType(null)
    setRelatedId(null)
    setIsFilterOpen(false)
    setHasExternalFilters(false)

    if (onResetFilters) {
      onResetFilters()
    }

    // Reset and load activities with default filters (3 months)
    loadActivities()
  }

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case "auth":
        return "🔐"
      case "transaction":
        if (activity.action.includes("lend")) return "💸"
        if (activity.action.includes("borrow")) return "💰"
        if (activity.action.includes("recover")) return "🔄"
        return "💱"
      case "contact":
        if (activity.action === "add") return "🔄"
        return "💱"
      case "contact":
        if (activity.action === "add") return "👤"
        if (activity.action === "update") return "✏️"
        if (activity.action === "delete") return "🗑️"
        return "👥"
      default:
        return "📝"
    }
  }

  const toggleActivityExpand = (activityId: string) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null)
    } else {
      setExpandedActivity(activityId)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {hasExternalFilters ? "Filtered activity results" : "Your recent activities from the past 3 months"}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {hasExternalFilters && (
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="rounded-md border overflow-auto flex-1">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleActivityExpand(activity.id)}
                      >
                        <TableCell className="font-medium text-center text-xl">{getActivityIcon(activity)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{activity.details}</div>
                          {activity.amount && (
                            <div className="text-sm text-muted-foreground">
                              Amount: {formatCurrency(activity.amount)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="capitalize">{activity.type}</span>
                          {" - "}
                          <span className="capitalize">{activity.action.replace("_", " ")}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {format(new Date(activity.timestamp), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>

                      {expandedActivity === activity.id && activity.type === "auth" && (
                        <TableRow>
                          <TableCell colSpan={4} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <h4 className="font-medium mb-2">Login Details</h4>

                              {activity.deviceInfo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center gap-2">
                                    <Laptop className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {activity.deviceInfo.device} - {activity.deviceInfo.os}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {activity.deviceInfo.browser} - {activity.deviceInfo.language}
                                    </span>
                                  </div>

                                  {activity.location && (
                                    <div className="flex items-center gap-2 md:col-span-2">
                                      <MapPin className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {activity.location} ({activity.deviceInfo.timeZone})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground mt-2">Activity ID: {activity.id}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => loadActivities(false)} disabled={loading}>
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No activities found for the selected filters.</div>
        )}

        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Filter Activities</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="startDate" className="text-sm font-medium">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="endDate" className="text-sm font-medium">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="activityType" className="text-sm font-medium">
                    Activity Type
                  </label>
                  <Select
                    value={activityType || "all"}
                    onValueChange={(value) => setActivityType(value === "all" ? null : value)}
                  >
                    <SelectTrigger id="activityType">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                      <SelectItem value="transaction">Transaction</SelectItem>
                      <SelectItem value="contact">Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="actionType" className="text-sm font-medium">
                    Action
                  </label>
                  <Select
                    value={actionType || "all"}
                    onValueChange={(value) => setActionType(value === "all" ? null : value)}
                  >
                    <SelectTrigger id="actionType">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="add_lend">Add Lending</SelectItem>
                      <SelectItem value="add_borrow">Add Borrowing</SelectItem>
                      <SelectItem value="add_recover">Add Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

