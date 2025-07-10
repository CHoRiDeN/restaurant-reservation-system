## FEATURE: Restaurant Reservation API Endpoints

* Implementation of the core REST API endpoints for managing restaurant reservations.
* Endpoints include: availability checking, reservation creation, table listing, and configuration retrieval.
* All endpoints are scoped under `/restaurants/:restId/`.
* Requests are authenticated via API key.

## ENDPOINTS INCLUDED:

* `GET /restaurants/:restId/availability`
* `POST /restaurants/:restId/reservations`
* `GET /restaurants/:restId/available-tables`
* `GET /restaurants/:restId/config`



## DOCUMENTATION:

Refer to the full README.md system specification for:

* Database schema is in migrations.sql
* Business rules and constraints
* Expected logic for reservation assignment and availability validation

## OTHER CONSIDERATIONS:

* All environment variables should be configured via `.env`.
* A `.env.example` file is provided with the expected variables:
NEXT_PUBLIC_SUPABASE_URL=https://eutadnfltlpcdwkwpiza.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dGFkbmZsdGxwY2R3a3dwaXphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3Mjg4MTcsImV4cCI6MjA2NzMwNDgxN30.jpfs3AMASEkzG3Vkl6_gVE6rJ_4rKqROpnTWOYU16ec


