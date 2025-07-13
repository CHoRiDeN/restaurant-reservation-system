'use client'

export default function CardWithHeader({ headerTitle, children }: { headerTitle: string, children: React.ReactNode }) {
    return (
        <div className="white-card p-[1px] flex flex-col">
            <div className="bg-slate-100 rounded-t-[12px] p-2 text-sm text-gray-500">{headerTitle}</div>
            <div className="px-4 py-4 flex flex-col gap-4">{children}</div>
        </div>
    )
}