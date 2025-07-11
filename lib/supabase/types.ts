// Database types (generated from schema)
export interface Restaurant {
  id: number;
  name: string;
  api_key: string;
  reservation_duration: number; // minutes
  buffer_time: number; // minutes
}

export interface Zone {
  id: number;
  name: string;
  restaurant_id: number;
}

export interface Table {
  id: number;
  capacity: number;
  zone_id?: number;
  restaurant_id: number;
}

export interface Schedule {
  id: number;
  day_of_week: number; // 0-6 (0=Sunday, 6=Saturday)
  opening_time: string; // HH:MM format
  closing_time: string; // HH:MM format
  restaurant_id: number;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  start_time: string; // ISO timestamp
  end_time: string; // ISO timestamp
  guests: number;
  table_id: number;
  restaurant_id: number;
  client_id: number; // Now required for all new reservations
  confirmed: boolean;
  notes?: string;
}

export interface ScheduleException {
  id: number;
  date: string; // YYYY-MM-DD format
  opening_time?: string; // HH:MM format
  closing_time?: string; // HH:MM format
  restaurant_id: number;
  description?: string;
}

// API Response types
export interface AvailabilityResponse {
  success: true;
  data: {
    date: string;
    guests: number;
    availableSlots: string[];
    tablesAvailable: number;
    totalTables: number;
    restaurant: {
      id: number;
      name: string;
      reservationDuration: number;
      bufferTime: number;
    };
  };
}

export interface ReservationResponse {
  success: true;
  data: {
    reservation: Reservation;
    table: Table;
    client?: Client;
  };
}

export interface ClientResponse {
  success: true;
  data: {
    client: Client;
  };
}

export interface ClientListResponse {
  success: true;
  data: {
    clients: Client[];
    total: number;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}