"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Filter } from "lucide-react"

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
}

export default function ActivityLog({ userId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [activityType, setActivityType] = useState<string | undefined>(undefined)
  const [actionType, setActionType] = useState<string | undefined>(undefined)

  useEffect(() => {
    loadActivities()
  }, [userId])

  const loadActivities = async (reset = true) => {
    if (reset) {
      setLoading(true)
    }

    try {
      const filters = {
        startDate,
        endDate,
        type: activityType,
        action: actionType,
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
    setActivityType(undefined)
    setActionType(undefined)
    setIsFilterOpen(false)

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
        if (activity.action === "add") return "👤"
        if (activity.action === "update") return "✏️"
        if (activity.action === "delete") return "🗑️"
        return "👥"
      default:
        return "📝"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Your recent activities from the past 3 months</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(true)}>
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent>
        {loading && activities.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : activities.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]"></TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium text-center text-xl">{getActivityIcon(activity)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{activity.details}</div>
                        {activity.amount && (
                          <div className="text-sm text-muted-foreground">Amount: {formatCurrency(activity.amount)}</div>
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
          <DialogContent className="sm:max-w-[425px]">
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
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger id="activityType">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined}>All Types</SelectItem>
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
                  <Select value={actionType} onValueChange={setActionType}>
                    <SelectTrigger id="actionType">
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={undefined}>All Actions</SelectItem>
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

