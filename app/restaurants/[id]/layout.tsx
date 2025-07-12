import RestaurantNavBar from "@/components/blocks/restaurantNavBar";
import { RestaurantRepository } from "@/repositories/database";


export default async function RestaurantLayout({
    params,
    children,
}: {
    params: Promise<{ id: string }>
    children: React.ReactNode
}) {
    const { id } = await params;
    const db = new RestaurantRepository();
    const restaurant = await db.getRestaurant(Number(id));
    return (
        <div>
            <RestaurantNavBar restaurant={restaurant} />
            {children}
        </div>
    )
}