import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function getTableImage(tableCapacity: number, partySize: number) {
  let tableSize = tableCapacity;
  if(tableCapacity > 8) {
    tableSize = 8;
  }
  let occupancy = partySize;
  if(occupancy > 8) {
    occupancy = 8;
  }
  return `/images/tables/table-${tableSize}-occupancy-${occupancy}.svg`
}