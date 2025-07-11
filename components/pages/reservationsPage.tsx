'use client'

import { Reservation, Restaurant, Schedule, Table } from "@/lib/supabase/types"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import moment from "moment"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getReservationsForDay } from "@/actions/restaurantActions"
import { createClient } from '@supabase/supabase-js';
import { getOpenAndCloseTimes } from "@/services/schedulesService"


const generateTimeSlots = (daySchedules: Schedule[]) => {

    const timeSlots: string[] = [];
    const { openTime, closeTime } = getOpenAndCloseTimes(daySchedules)

    // Convert times to Date objects for easier manipulation
    const currentTime = new Date(`1970-01-01T${openTime}`);
    const endTime = new Date(`1970-01-01T${closeTime}`);

    // Generate 15-minute interval slots
    while (currentTime <= endTime) {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        timeSlots.push(`${hours}:${minutes}`);
        currentTime.setMinutes(currentTime.getMinutes() + 15);
    }


    return timeSlots;
}
export default function CSRestaurantReservationsPage({ tables, restaurant, daySchedules }: { tables: Table[], restaurant: Restaurant, daySchedules: Schedule[] }) {


    //get date from query params
    const searchParams = useSearchParams()
    const date = searchParams.get('date')
    const reservationDate = date ? new Date(date as string) : new Date();
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>(reservationDate)
    const gridWidth = 25;


    const fetchReservations = async () => {
        const reservations = await getReservationsForDay(restaurant.id, selectedDate.toISOString())
        setReservations(reservations)
    }


    useEffect(() => {
        fetchReservations();
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const channel = supabase
            .channel('reservations-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurant.id}`,
                },
                () => {
                    fetchReservations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [restaurant.id, selectedDate]);



    const timeSlots = generateTimeSlots(daySchedules);

    const getReservationPosition = (reservation: Reservation, startTime: string) => {


        const openingTime = timeSlots[0];
        const openingHour = Number(openingTime.split(':')[0]);


        const startDate = moment(startTime).utc();

        const startHour = startDate.hour()
        const startMinute = startDate.minute()


        const hourIntervals = (startHour - openingHour) * 4 * gridWidth;
        const minuteIntervals = startMinute / 15 * gridWidth;
        const startPosition = hourIntervals + minuteIntervals;
        const width = gridWidth * 4



        return { left: startPosition, width: width }
    }



    return (
        <div className="max-w-6xl mx-auto ">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">Restaurant Reservations</h1>

                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))}
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
                                onSelect={(date) => setSelectedDate(date || new Date())}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>


            </div>

            {/* Timeline */}

            <div className="grid grid-cols-[140px_1fr]">


                <table className={` border-collapse`}>
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



                <div className="overflow-x-scroll w-full">
                    {/* Time Header */}
                    <div className="flex flex-row" style={{ width: `${(timeSlots.filter(time => time.endsWith(":00")).length - 1) * gridWidth * 4}px` }}>
                        {timeSlots.map((time, key) => (
                            ((time.endsWith(":00") && key !== timeSlots.length - 1) && (
                                <div
                                    key={time}
                                    style={{ width: `${gridWidth * 4}px` }}
                                    className={`p-2 text-center text-xs font-medium border-r border-b bg-muted/50 font-semibold box-border`}
                                >
                                    {time.endsWith(":00") ? time : ""}
                                </div>
                            ))
                        ))}
                    </div>
                    {/* Table Rows */}
                    {tables.map((table) => (
                        <div key={table.id} className="hover:bg-muted/50">

                            {/* Timeline cells with reservations */}
                            <div className="relative h-16 border-b" style={{ width: `${(timeSlots.length - 1) * gridWidth}px` }}>
                                <div className="absolute inset-0 flex">
                                    {/* Time Grid Lines */}
                                    {timeSlots.map((time, index) => (
                                        ((index !== timeSlots.length - 1) && (
                                            <div
                                                key={index}
                                                className={`border-l h-full ${time.endsWith(":00") ? "border-gray-300" : "border-gray-100"}`}
                                                style={{ width: `${gridWidth}px` }}
                                            />
                                        ))
                                    ))}

                                    {/* Reservations */}
                                    {reservations
                                        .filter((reservation) => reservation.table_id === table.id)
                                        .map((reservation) => {
                                            const { left, width } = getReservationPosition(reservation, reservation.start_time)
                                            return (
                                                <div
                                                    key={reservation.id}
                                                    className={`absolute top-1 bottom-1 rounded px-2 py-1 text-white text-xs cursor-pointer transition-colors bg-green-500 hover:bg-green-600`}
                                                    style={{
                                                        left: `${left}px`,
                                                        width: `${width}px`,
                                                        minWidth: `${gridWidth}px`,
                                                    }}
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
                            </div>
                        </div>
                    ))}





                </div>

            </div>


        </div >

    )
} 