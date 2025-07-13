'use client'

export default function ContentRow({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-[17px] font-medium border-b border-gray-200 pb-2">{title}</div>
            <div className="text-base flex flex-col gap-4">{children}</div>
        </div>
    )
}