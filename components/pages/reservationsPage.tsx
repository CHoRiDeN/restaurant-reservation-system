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
import { getDaySchedules, getReservationsForDay } from "@/actions/restaurantActions"
import { createClient } from '@supabase/supabase-js';
import { getOpenAndCloseTimes } from "@/services/schedulesService"
import Image from "next/image"


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
export default function CSRestaurantReservationsPage({ tables, restaurant }: { tables: Table[], restaurant: Restaurant }) {


    //get date from query params
    const searchParams = useSearchParams()
    const date = searchParams.get('date')
    const reservationDate = date ? new Date(date as string) : new Date();
    const [reservations, setReservations] = useState<Reservation[]>([])
    const [daySchedules, setDaySchedules] = useState<Schedule[]>([])
    const [selectedDate, setSelectedDate] = useState<Date>(reservationDate)
    const gridWidth = 52;


    const fetchReservations = async () => {
        const reservations = await getReservationsForDay(restaurant.id, selectedDate.toISOString())
        setReservations(reservations)
    }

    const fetchDaySchedules = async () => {
        const daySchedules = await getDaySchedules(restaurant.id, selectedDate.getDay())
        setDaySchedules(daySchedules)
    }


    useEffect(() => {
        fetchReservations();
        fetchDaySchedules();
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



        return { left: startPosition + 5, width: width - 10 }
    }



    return (
        <div className="w-full px-16 mt-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 >Reservas</h1>

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

            <div className="bookings-card w-full grid grid-cols-[200px_1fr]">
                {/* Mesas */}
                <div className="tables-column flex flex-col divide-y divide-gray-200">
                    {tables.map((table) => (
                        <div key={table.id} className="table-row">
                            <div className="text-[15px]">Mesa #{table.id}</div>
                            <div className="text-[13px] text-gray-500">{table.capacity} Comensales</div>
                        </div>
                    ))}
                </div>
                {/* Reservas */}
                <div className="overflow-x-scroll w-full h-full">
                    <div className="relative flex flex-row h-full" style={{ width: `${(timeSlots.filter(time => time.endsWith(":00")).length - 1) * gridWidth * 4}px` }}>
                        {timeSlots.map((time, key) => (
                            ((time.endsWith(":00") && key !== timeSlots.length - 1) && (
                                <div
                                    key={key}
                                    style={{ width: `${gridWidth * 4}px` }}
                                    className={`h-full  border-r  border-gray-200 `}
                                >
                                    <div className="text-[13px] text-gray-500 h-[33px] flex items-center pl-1">{time}</div>
                                    <div className="border-t border-gray-200 "></div>
                                </div>
                            ))
                        ))}

                        <div className="absolute inset-0 flex top-[33px] flex-col">

                            {/* Reservations */}
                            {tables.map((table, key) => (
                                <div key={key} className="relative flex flex-row border-b border-gray-200 h-[101px]" style={{ width: `${(timeSlots.filter(time => time.endsWith(":00")).length - 1) * gridWidth * 4}px` }}>
                                    {reservations
                                        .filter((reservation) => reservation.table_id === table.id)
                                        .map((reservation) => {
                                            const { left, width } = getReservationPosition(reservation, reservation.start_time)
                                            return (
                                                <div
                                                    key={reservation.id}
                                                    className={`absolute top-1 bottom-1 reservation-card flex flex-col justify-between`}
                                                    style={{
                                                        left: `${left}px`,
                                                        width: `${width}px`,
                                                        minWidth: `${gridWidth}px`,
                                                    }}
                                                >
                                                    <div className="flex flex-row justify-between items-center text-[13px]">
                                                        <div>{new Date(reservation.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        <div className="flex flex-row items-center gap-1 text-gray-500 ">
                                                            <div>{reservation.guests}</div>
                                                            <Image src="/images/icons/people.svg" alt="paxs" width={15} height={15} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-row gap-2 items-center text-[15px]">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                        <div>{reservation.clients?.name}</div>
                                                    </div>

                                                </div>
                                            )
                                        })}
                                </div>
                            ))}
                        </div>



                    </div>
                </div>

            </div>


        </div >

    )
} 