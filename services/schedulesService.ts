import { Schedule } from "@/lib/supabase/types"

export function getOpenAndCloseTimes(daySchedules: Schedule[]) {
   const sortedSchedules = daySchedules.sort((a, b) => a.opening_time.localeCompare(b.opening_time))
   const firstSchedule = sortedSchedules[0]
   const lastSchedule = sortedSchedules[sortedSchedules.length - 1]
   return { openTime: firstSchedule?.opening_time, closeTime: lastSchedule?.closing_time }
}