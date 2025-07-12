'use client'

import { SignedIn, UserButton } from "@clerk/nextjs"
import { Restaurant } from "@/lib/supabase/types"
import Link from "next/link"
import Image from "next/image"

export default function RestaurantNavBar({ restaurant }: { restaurant: Restaurant }) {
    return (
        <nav className="flex flex-row justify-between items-center p-4 py-3">
            <Link href="/">
                <div>nora</div>
            </Link>
            <div className="flex flex-row gap-5 text-sm">
                <Link href={`/restaurants/${restaurant.id}/reservations`} className="flex flex-row gap-2 items-center opacity-50 hover:opacity-100">
                    <Image src="/images/icons/filled-calendar.svg" alt="reservations" width={18} height={18} className="text-black" />
                    Reservas
                </Link>
                <Link href={`/restaurants/${restaurant.id}/tables`} className="flex flex-row gap-2 items-center opacity-50 hover:opacity-100">
                    <Image src="/images/icons/calendar.svg" alt="tables" width={18} height={18} className="text-black" />
                    Mesas
                </Link>
                <Link href={`/restaurants/${restaurant.id}/settings`} className="flex flex-row gap-2 items-center opacity-50 hover:opacity-100">
                    <Image src="/images/icons/calendar.svg" alt="settings" width={18} height={18} className="text-black" />
                    Configuración
                </Link>
            </div>
            <div className="flex flex-row gap-3 items-center">
                <div className="text-sm text-gray-500">{restaurant.name}</div>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </nav>
    )
}