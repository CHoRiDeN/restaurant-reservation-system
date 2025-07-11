import ReservationsPage from "@/components/pages/reservationsPage"
import { RestaurantRepository } from "@/repositories/database"


export default async function RestaurantReservationsPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ date?: string }>
}) {
    const { id } =  await params
    const { date } =  await searchParams
    const reservationDate = date ? new Date(date as string) : new Date();
    const weekDay = reservationDate.getDay();

    const db = new RestaurantRepository();

    const tables = await db.getTables(Number(id));



    const restaurant = await db.getRestaurant(Number(id));
    const daySchedules = await db.getSchedules(Number(id), weekDay);
   

    return <ReservationsPage 
    tables={tables || []} 
    restaurant={restaurant} 
    daySchedules={daySchedules || []} 
    />;
}