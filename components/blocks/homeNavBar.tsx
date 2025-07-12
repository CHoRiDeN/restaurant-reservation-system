'use client'

import { SignedIn, UserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export default function HomeNavBar() {
    const router = useRouter()

    return (
        <div className="flex flex-row justify-between items-center p-4">
            <div>nora</div>
            <div className="">
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </div>
        </div>
    )
}