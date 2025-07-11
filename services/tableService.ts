import { RestaurantRepository } from "@/repositories/database"
import { getOpenAndCloseTimes } from "./schedulesService"

export async function getAvailableSlotsForDayAndTable(restaurantId: number, date: Date, tableId: number) {

    const db = new RestaurantRepository()
    const reservations = await db.getTableReservations(restaurantId, tableId, date)
    const restaurant = await db.getRestaurant(restaurantId)
    const daySchedules = await db.getSchedules(restaurantId, date.getDay())
    const slots = []
    for (let i = 0; i < reservations.length; i++) {
        if(i < reservations.length - 1) {
            const reservation = reservations[i]
            const nextReservation = reservations[i + 1]
            const reservationEnd = new Date(reservation.end_time)
            const bufferEnd = new Date(reservationEnd.getTime() + restaurant.buffer_time * 60000)
            const slot = {
                start_time: new Date(bufferEnd),
                end_time: new Date(nextReservation.start_time)
            }
            slots.push(slot)
        }
    }
    const { openTime, closeTime } = getOpenAndCloseTimes(daySchedules)
    const openHour = openTime?.split(':')[0]
    const openMinute = openTime?.split(':')[1]
    const closeHour = closeTime?.split(':')[0]
    const closeMinute = closeTime?.split(':')[1]
   
    const openDateTime = new Date(date.setHours(Number(openHour), Number(openMinute), 0, 0))
    const closeDateTime = new Date(date.setHours(Number(closeHour), Number(closeMinute), 0, 0))
    if(openTime && reservations.length > 0 && openDateTime < new Date(reservations[0].start_time)) {
        slots.push({
            start_time: openDateTime,
            end_time: new Date(reservations[0].start_time)
        })
    }
    if(closeTime && reservations.length > 0 && closeDateTime > new Date(reservations[reservations.length - 1].end_time)) {
        slots.push({
            start_time: new Date(reservations[reservations.length - 1].end_time),
            end_time: closeDateTime
        })
    }
    slots.sort((a, b) => a.start_time.getTime() - b.start_time.getTime())
    return filterAvailableSlots(slots, restaurant.reservation_duration)
}

export function filterAvailableSlots(slots: { start_time: Date, end_time: Date }[], reservationDuration: number) {
    return slots.filter(slot => {
        const durationInMilliseconds = reservationDuration * 60000;
        const slotDuration = slot.end_time.getTime() - slot.start_time.getTime();
        return slotDuration >= durationInMilliseconds;
    });
}