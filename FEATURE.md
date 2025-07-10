## FEATURE: Add next functionalities

* It must not be possible to book the same table at the same time. When creating a new reservation we must see which are the remaining tables and assign one. IF there are not available tables the reservastion cannot be made. Now I've created 3 reservations and i've been assigned the same table. ENSURE THIS IS NOT POSSIBLE. 
* now when doing a reservation must provide client data. (name, email, phone) so new user is created in db (if doesnt exists) and linked to reservation. if the user exsits is just linked



## NOTES
* We updated reservations columns to reflect reservation from and to datetime:
alter table reservations
drop date,
add column start_time timestamp not null,
add column end_time timestamp not null;

* You can test with restaurant 1 with api key a6ba04e7-9d19-45f2-a004-43a4b9784828
* restaurant 1 has 4 tables: 2 with capacity 4, 1 with capacity 6 and 1 with caapcity 8