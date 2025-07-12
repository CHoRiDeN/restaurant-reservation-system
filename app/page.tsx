import HomeNavBar from "@/components/blocks/homeNavBar";
import CSRestaurantsPage from "@/components/pages/restaurantsPage";
import { RestaurantRepository } from "@/repositories/database";

export default async function Home() {
  const db = new RestaurantRepository()
  const restaurants = await db.getRestaurants()
  return (
    <main>
      <HomeNavBar />
      <CSRestaurantsPage restaurants={restaurants} />
    </main>
  );
}
