
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
  date timestamp not null,
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
