'use client'

import { Reservation } from "@/lib/supabase/types"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"
import moment from "moment"
import Image from "next/image"
import { Button } from "../ui/button"
import ContentRow from "./contentRow"
import CalendarWidget from "../ui/calendarWidget"

export default function ReservationSheet({ reservation }: { reservation: Reservation }) {
    return (
        <Sheet>
            <SheetTrigger className=" reservation-card flex flex-col justify-between w-full h-full hover:cursor-pointer">
                <div className="flex flex-row justify-between items-center text-[13px]">
                    <div>{moment(reservation.start_time).utc().format('HH:mm')}</div>
                    <div className="flex flex-row items-center gap-1 text-gray-500 ">
                        <div>{reservation.guests}</div>
                        <Image src="/images/icons/people.svg" alt="paxs" width={15} height={15} />
                    </div>
                </div>
                <div className="flex flex-row gap-2 items-center text-[15px]">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>{reservation.client?.name}</div>
                </div>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <Button size="sm" variant="secondarydestructive">Cancelar reserva</Button>
                </SheetHeader>
                <div className="flex flex-col gap-10 px-4 py-0">
                    <div>
                        <div className="text-base text-gray-400">#{reservation.id}</div>
                        <SheetTitle>Reserva para {reservation.guests}</SheetTitle>

                    </div>
                    <div>
                        <CalendarWidget date={new Date(reservation.start_time)} />
                    </div>

                    <ContentRow title="A nombre de" >
                        <div className="flex flex-row gap-2 items-center w-full justify-between">
                            <div> {reservation.client?.name}</div>
                            <div> {reservation.client?.phone}</div>

                        </div>
                    </ContentRow>

                    <ContentRow title="Notas" >
                        {reservation.notes || "No hay notas"}
                    </ContentRow>
                    <ContentRow title="Reservas anteriores" >
                        No hay reservas anteriores
                    </ContentRow>
                    <ContentRow title="Detalles de la llamada" >
                        <audio controls={true} className="h-11 w-full" src="https://dxc03zgurdly9.cloudfront.net/e2cb4dcc16e56715cb4adb4b892555c5322152a3d9e00a5d7cdd806229a1c924/recording.wav">Your browser does not support the audio element.</audio>
                    </ContentRow>
                </div>

                <SheetFooter>
                    <Button>Check-in</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}