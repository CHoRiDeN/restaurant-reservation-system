import { Schedule } from "@/lib/supabase/types"
import moment from "moment"

export function getOpenAndCloseTimes(daySchedules: Schedule[]) {
   const sortedSchedules = daySchedules.sort((a, b) => a.opening_time.localeCompare(b.opening_time))
   const firstSchedule = sortedSchedules[0]
   const lastSchedule = sortedSchedules[sortedSchedules.length - 1]
   return { openTime: firstSchedule?.opening_time, closeTime: lastSchedule?.closing_time }
}

export function isInSchedule(schedules: Schedule[], time: string) {
    for (const schedule of schedules) {
        const openingTime = new Date(`1970-01-01T${schedule.opening_time}`)
        const closingTime = new Date(`1970-01-01T${schedule.closing_time}`)
        const timeMoment = new Date(`1970-01-01T${time}:00`)
        if (timeMoment >= openingTime && timeMoment < closingTime) {
            return true
        }
    }
    return false
}