'use server'

import { RestaurantRepository } from "@/repositories/database"

export async function getReservationsForDay(restaurantId: number, date: string) {
    const db = new RestaurantRepository()
    const reservations = await db.getReservationsForDay(restaurantId, date)
    return reservations
}