'use client'

import { Reservation, Restaurant, Schedule, Table } from "@/lib/supabase/types"
import { Badge, Card } from "@radix-ui/themes"
import { Calendar, ChevronLeft, ChevronRight, Clock, Mail, Phone, Users } from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import moment from "moment"



const timeSlots = [
    "09:00",
    "09:15",
    "09:30",
    "09:45",
    "10:00",
    "10:15",
    "10:30",
    "10:45",
    "11:00",
    "11:15",
    "11:30",
    "11:45",
    "12:00",
    "12:15",
    "12:30",
    "12:45",
    "13:00",
    "13:15",
    "13:30",
    "13:45",
    "14:00",
    "14:15",
    "14:30",
    "14:45",
    "15:00",
    "15:15",
    "15:30",
    "15:45",
    "16:00",
    "16:15",
    "16:30",
    "16:45",
    "17:00",
    "17:15",
    "17:30",
    "17:45",
    "18:00",
    "18:15",
    "18:30",
    "18:45",
    "19:00",
    "19:15",
    "19:30",
    "19:45",
    "20:00",
    "20:15",
    "20:30",
    "20:45",
    "21:00",
    "21:15",
    "21:30",
    "21:45",
    "22:00",
    "22:15",
    "22:30",
    "22:45",
    "23:00",
]


const generateTimeSlots = (daySchedules: Schedule[]) => {
    //daySchedules is an array of schedules for a day
    const timeSlots: string[] = [];

    if (daySchedules.length === 0) {
        return timeSlots;
    }

    // Find the earliest opening time and the latest closing time
    let earliestOpeningTime = daySchedules[0].opening_time;
    let latestClosingTime = daySchedules[0].closing_time;

    daySchedules.forEach(schedule => {
        if (schedule.opening_time < earliestOpeningTime) {
            earliestOpeningTime = schedule.opening_time;
        }
        if (schedule.closing_time > latestClosingTime) {
            latestClosingTime = schedule.closing_time;
        }
    });

    // Convert times to Date objects for easier manipulation
    let currentTime = new Date(`1970-01-01T${earliestOpeningTime}`);
    const endTime = new Date(`1970-01-01T${latestClosingTime}`);

    // Generate 15-minute interval slots
    while (currentTime <= endTime) {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        timeSlots.push(`${hours}:${minutes}`);
        currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return timeSlots;
}
export default function CSRestaurantReservationsPage({ reservations, tables, restaurant, daySchedules, selectedDate }: { reservations: Reservation[], tables: Table[], restaurant: Restaurant, daySchedules: Schedule[], selectedDate: Date }) {


    const gridWidth = 25;
    const [selectedReservation, setSelectedReservation] = useState<any>(null)

    const timeSlots = generateTimeSlots(daySchedules);
    console.log('slots', timeSlots)

    const getReservationPosition = (reservation: Reservation, startTime: string, endTime: string) => {


        const openingTime = timeSlots[0];
        const openingHour = Number(openingTime.split(':')[0]);
        const openingMinute = Number(openingTime.split(':')[1]);

 
        const startDate = moment(startTime);
        const endDate = moment(endTime);

        const startHour = startDate.hour()
        const startMinute = startDate.minute()

    
        const hourIntervals = (startHour - openingHour) * 4 * gridWidth;
        const minuteIntervals = startMinute / 15 * gridWidth;
        const startPosition = hourIntervals + minuteIntervals;
        const width = gridWidth * 4



        return { left: startPosition, width: width }
    }



    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Restaurant Reservations</h1>
                   
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => console.log(selectedDate)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[200px] justify-start text-left font-normal bg-transparent">
                                <Calendar className="mr-2 h-4 w-4" />
                                {format(selectedDate, "MMM d, yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => console.log(date)}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => console.log(selectedDate)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

            
            </div>

            {/* Timeline */}

            <div className="flex flex-row">


                <table className={`w-[140px] border-collapse`}>
                    <thead>
                        <tr>
                            <th className={`p-2 text-center text-xs font-medium border-r border-b w-full`}>
                                Mesa
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tables.map((table) => (
                            <tr key={table.id}>
                                <td className={`p-2 text-center text-xs font-medium border-r border-b w-full`}>
                                    #{table.id} {table.capacity} PAXS
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>



                <div className="overflow-x-auto">
                    <table className="min-w-[1400px] w-full border-collapse">
                        {/* Time Header */}
                        <thead>
                            <tr>
                                {timeSlots.map((time) => (
                                    (time.endsWith(":00") && (
                                        <th
                                            key={time}
                                            className={`p-2 text-center text-xs font-medium border-r border-b w-full bg-muted/50 font-semibold box-border`}
                                            style={{ width: `${gridWidth * 4}px` }}
                                        >
                                            {time.endsWith(":00") ? time : ""}
                                        </th>
                                    ))
                                ))}
                            </tr>
                        </thead>

                        {/* Table Rows */}
                        <tbody>
                            {tables.map((table) => (
                                <tr key={table.id} className="hover:bg-muted/50">

                                    {/* Timeline cells with reservations */}
                                    <td className="relative h-16 border-b" colSpan={timeSlots.length}>
                                        <div className="absolute inset-0 flex">
                                            {/* Time Grid Lines */}
                                            {timeSlots.map((time, index) => (
                                                <div
                                                    key={index}
                                                    className={`border-l h-full ${time.endsWith(":00") ? "border-gray-300" : "border-gray-100"}`}
                                                    style={{ width: `${gridWidth}px` }}
                                                />
                                            ))}

                                            {/* Reservations */}
                                            {reservations
                                                .filter((reservation) => reservation.table_id === table.id)
                                                .map((reservation) => {
                                                    const { left, width } = getReservationPosition(reservation, reservation.start_time, reservation.end_time)
                                                    return (
                                                        <div
                                                            key={reservation.id}
                                                            className={`absolute top-1 bottom-1 rounded px-2 py-1 text-white text-xs cursor-pointer transition-colors bg-green-500 hover:bg-green-600`}
                                                            style={{
                                                                left: `${left}px`,
                                                                width: `${width}px`,
                                                                minWidth: `${gridWidth}px`,
                                                            }}
                                                            onClick={() => setSelectedReservation(reservation)}
                                                        >
                                                             <div className="text-xs opacity-90">
                                                               #{reservation.id}
                                                            </div>
                                                            <div className="font-medium truncate">Client id: {reservation.client_id}</div>
                                                            <div className="text-xs opacity-90">
                                                                {reservation.guests} PAXS
                                                            </div>
                                                           
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>


        </div >

    )
} 