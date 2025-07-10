
create table restaurants (
  id bigint primary key generated always as identity,
  name text not null,
  api_key text unique not null,
  reservation_duration int default 60,
  buffer_time int default 15
);

create table zones (
  id bigint primary key generated always as identity,
  name text not null,
  restaurant_id bigint references restaurants (id)
);

create table tables (
  id bigint primary key generated always as identity,
  capacity int not null,
  zone_id bigint references zones (id),
  restaurant_id bigint references restaurants (id) not null
);

create table schedules (
  id bigint primary key generated always as identity,
  day_of_week int not null,
  opening_time time not null,
  closing_time time not null,
  restaurant_id bigint references restaurants (id) not null
);

create table reservations (
  id bigint primary key generated always as identity,
  start_time timestamp not null,
  end_time timestamp not null,
  guests int not null,
  table_id bigint references tables (id) not null,
  restaurant_id bigint references restaurants (id) not null,
  confirmed boolean default true
);

create table schedule_exceptions (
  id bigint primary key generated always as identity,
  date date not null,
  opening_time time,
  closing_time time,
  restaurant_id bigint references restaurants (id) not null,
  description text
);

-- Add clients table
create table clients (
  id bigint primary key generated always as identity,
  name text not null,
  email text unique not null,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add client_id to reservations with foreign key
alter table reservations
add column client_id bigint references clients (id) not null;

-- Add exclusion constraint to prevent overlapping reservations
-- This prevents any two reservations for the same table from having overlapping time periods
alter table reservations 
add constraint no_overlapping_reservations 
exclude using gist (
  table_id with =, 
  tsrange(start_time, end_time) with &&
);

-- Add check constraint for valid guest count
alter table reservations
add constraint valid_guest_count check (guests > 0 AND guests <= 20);

-- Add check constraint to ensure end_time is after start_time
alter table reservations
add constraint valid_time_range check (end_time > start_time);

-- Add check constraint to ensure reservation is not too long (max 4 hours)
alter table reservations
add constraint reasonable_duration check (end_time - start_time <= interval '4 hours');

-- Add index for client lookups
create index idx_reservations_client_id on reservations(client_id);

-- Add index for availability queries with new time schema
create index idx_reservations_table_time on reservations using gist (table_id, tsrange(start_time, end_time));

-- Add index for restaurant queries
create index idx_reservations_restaurant_time on reservations(restaurant_id, start_time);