import ReservationsPage from "@/components/pages/reservationsPage"
import { RestaurantRepository } from "@/repositories/database"


export default async function RestaurantReservationsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } =  await params
    const db = new RestaurantRepository();
    const tables = await db.getTables(Number(id));
    const restaurant = await db.getRestaurant(Number(id));

    return <ReservationsPage 
    tables={tables || []} 
    restaurant={restaurant} 
    />;
}