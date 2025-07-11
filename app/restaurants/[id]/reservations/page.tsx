import ReservationsPage from "@/components/pages/reservationsPage"
import { RestaurantRepository } from "@/repositories/database"


export default async function RestaurantReservationsPage({
    params,
    searchParams,
}: {
    params: { id: string }
    searchParams: { date?: string }
}) {
    const { id } = await params
    const { date } = await searchParams
    const reservationDate = date ? new Date(date) : new Date();
    const weekDay = reservationDate.getDay();

    const db = new RestaurantRepository();

    const { data: tables } = await db.getTables(Number(id));

    const { data: reservations, error } = await db.getReservationsForDay(
        Number(id),
        reservationDate.toISOString()
    );

    const { data: restaurant } = await db.getRestaurant(Number(id));
    const { data: daySchedule } = await db.getSchedule(Number(id), weekDay);
   

    return <ReservationsPage 
    reservations={reservations} 
    tables={tables || []} 
    restaurant={restaurant} 
    daySchedule={daySchedule || []} 
    selectedDate={reservationDate}
    />;
}