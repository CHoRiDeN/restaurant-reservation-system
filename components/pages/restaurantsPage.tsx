'use client'

import { Restaurant } from "@/lib/supabase/types"
import Image from "next/image"
import Link from "next/link"


export default function CSRestaurantsPage({ restaurants }: { restaurants: Restaurant[] }) {
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 pt-6">
            <h1>Restaurantes</h1>
            <div className="flex flex-col gap-4">
                {restaurants.map((restaurant) => (
                    <Link href={`/restaurants/${restaurant.id}/reservations`} key={restaurant.id}>
                        <div  className="white-card flex flex-row justify-between items-start px-5 py-4 hover:cursor-pointer">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-xl font-medium">{restaurant.name}</h2>
                                <div className="flex flex-col gap-0">
                                    <div className="text-base text-gray-500 flex flex-row gap-1">
                                        <Image src="/images/icons/people.svg" alt={restaurant.name} width={16} height={16} />
                                        <div><span className="font-medium text-foreground">139</span> Clientes</div>
                                    </div>
                                    <div className="text-base text-gray-500 flex flex-row gap-1">
                                        <Image src="/images/icons/calendar.svg" alt={restaurant.name} width={16} height={16} />
                                        <div><span className="font-medium text-foreground">56</span> Reservas</div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-[120px] aspect-square bg-gray-200 rounded-md overflow-hidden">
                                <Image src="/images/abstract-1.jpg" alt={restaurant.name} width={120} height={120} className="object-cover" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}