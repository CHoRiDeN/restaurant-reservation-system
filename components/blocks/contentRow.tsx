'use client'

export default function ContentRow({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-500 border-b border-gray-200 pb-2">{title}</div>
            <div className="text-base">{children}</div>
        </div>
    )
}