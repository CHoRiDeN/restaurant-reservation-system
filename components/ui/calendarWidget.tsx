'use client'

import moment from "moment"

export default function CalendarWidget({ date }: { date: Date }) {
    const momentDate = moment(date).utc();
    return (
        <div className="flex flex-row gap-2 items-center">


            <div className="w-[40px] h-[40px] rounded-[8px] border border-gray-200 flex flex-col items-center text-center">
                <div className="bg-slate-100 rounded-t-[8px] text-[9px] text-gray-600 w-full leading-none font-medium h-16 flex items-center justify-center">
                    {momentDate.format('MMM')}
                </div>
                <div className="rounded-b-[8px] py-1 text-[15px] w-full text-gray-800 leading-none">
                    {momentDate.format('D')}
                </div>
            </div>
            <div className="flex flex-col gap-0">
                <div className="text-sm text-gray-900">{momentDate.format('dddd DD')}</div>
                <div className="text-sm text-gray-500">{momentDate.format('HH:mm')} - {momentDate.add(2, 'hours').format('HH:mm')}</div>
            </div>
        </div>
    )
}