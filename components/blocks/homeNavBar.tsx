'use client'

import { SignedIn, UserButton } from "@clerk/nextjs"

export default function HomeNavBar() {

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