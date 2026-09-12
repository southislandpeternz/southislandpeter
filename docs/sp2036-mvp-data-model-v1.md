# SP2036 MVP Data Model v1

Source: Admin UI mock-data.ts + status.ts · commit `d4b4e59` · design only, no database.

Formalises the accepted Admin UI mock into eight tables. All services stay on one Departure / Service Arrangement model. No extra tables in MVP.

**Design only.** Do not create PostgreSQL tables, Prisma models, NestJS APIs, or Stripe objects from this document. Current Admin UI keeps mock data. Prisma today is DP00 health-check only.

| | |
| --- | --- |
| MVP tables | 8 |
| Foreign keys | 6 relationship groups |
| Service types | 3 |
| Booked / Available / OPEN·FULL | Computed, not stored |

## A. ER relationship

Catalog flows into operations. Operations flow into money. Vehicle and Driver hang off Departure, not Product.

```
products 1 ──< routes
products 1 ──< departures
routes   1 ──< departures
vehicles 1 ──< departures     (nullable)
drivers  1 ──< departures     (nullable)
departures 1 ──< bookings
customers  1 ──< bookings
bookings   1 ── 1 payments

Product → Route → Departure → Booking → Customer
Departure also → Vehicle, Driver
Booking also → Payment
```

## B. Table list

| Table | Purpose | Primary key | FK targets |
| --- | --- | --- | --- |
| products | Sellable MVP service (shuttle / cruise / airport) | id | — |
| routes | Named origin → destination used by a product | id | products |
| departures | One operable service instance (the operations core) | id | products, routes, vehicles, drivers |
| bookings | Guest purchase on one departure | id | customers, departures |
| customers | Guest record behind bookings | id | — |
| payments | One payment record per booking in MVP | id | bookings |
| vehicles | Fleet assigned per departure | id | — |
| drivers | Drivers assigned per departure | id | — |

## C. Fields per table

Types are PostgreSQL. Amounts are NZD dollars as integer (matches mock `amountNzd`). Empty mock strings become NULL.

### products

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | e.g. prod-mount-cook-shuttle |
| code | text | Yes unique | mount-cook-shuttle · kaikoura-shuttle · akaroa-shuttle · lyttelton-cruise · akaroa-cruise · airport-transfer |
| name | text | Yes | Mount Cook Shuttle |
| service_type | text | Yes | FIXED_SHUTTLE \| CRUISE_DAY_TOUR \| AIRPORT_TRANSFER |
| is_fixed_schedule | boolean | Yes | true for shuttles; false for cruise / airport |
| notes | text | No | Optional ops note |

### routes

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | e.g. rte-chc-mtcook |
| product_id | text | FK | → products.id |
| name | text | Yes | Display string used today on Departure.route |
| origin | text | Yes | Christchurch / Lyttelton Port / Airport |
| destination | text | Yes | Aoraki / Mt Cook, city hotels, return to ship |
| notes | text | No | Optional |

### departures

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | Mock: dep-mtcook-thu-return |
| service_type | text | Yes | Must match products.service_type |
| product_id | text | FK | → products.id |
| route_id | text | FK | → routes.id |
| display_name | text | Yes | Mock name: Mount Cook Shuttle · Return |
| date | date | Yes | NZ local date |
| departure_time | time | Yes | Mock time 07:30 / 09:00 / 11:30 / 16:00 |
| return_time | time | No | NULL if outbound overnight or airport |
| direction | text | Yes | OUTBOUND \| RETURN \| DAY_RETURN \| ON_DEMAND |
| vehicle_id | text | No FK | → vehicles.id · NULL = not assigned |
| driver_id | text | No FK | → drivers.id · NULL = Driver not assigned |
| capacity | integer | Yes | Planned seats. Load uses vehicle.seats when assigned |
| status | text | Yes | Operational: PLANNED \| RESOURCE_ASSIGNED \| READY \| DEPARTED \| COMPLETED \| CANCELLED |
| pickup_information | text | Yes | Default pickup for the departure |
| notes | text | No | Weekly pattern / ad-hoc notes |
| created_at / updated_at | timestamptz | Yes | System columns |

Not stored: booked, available, inventory_status (DRAFT/OPEN/FULL), CAPACITY EXCEEDED. Those stay computed from confirmed booking pax vs `vehicle.seats ?? capacity`.

### bookings

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | Internal id · mock bk-mc-li-out |
| booking_no | text | Yes unique | Business key · BO-MC-2411 |
| customer_id | text | FK | → customers.id |
| departure_id | text | FK | → departures.id |
| booking_date | date | Yes | Mock bookedOn · not departure date |
| passengers | integer | Yes | Mock pax · confirmed seats on that departure |
| amount_nzd | integer | Yes | Whole NZD as in mock |
| booking_status | text | Yes | PENDING \| CONFIRMED \| CANCELLED |
| payment_status | text | Yes | PENDING \| DEPOSIT_PAID \| PAID \| REFUNDED · mirrors payments.status |
| passenger_status | text | Yes | CONFIRMED \| CHECKED_IN \| NO_SHOW \| CANCELLED · V1.1 check-in |
| source | text | Yes | WEBSITE \| GOOGLE \| XIAOHONGSHU \| PHONE \| CRUISE |
| pickup | text | No | Override; else use departure.pickup_information |

### customers

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | cus-li |
| name | text | Yes | Guest name |
| phone | text | Yes | Contact display |
| email | text | Yes | Unique recommended |
| country | text | Yes | Guest country |
| source | text | Yes | First-touch channel |
| notes | text | No | Not in mock; optional later |

### payments

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | pay-1 |
| booking_id | text | FK unique | → bookings.id · MVP 1:1 |
| payment_date | date | No | NULL while PENDING |
| amount_nzd | integer | Yes | May be 30% deposit in mock |
| method | text | Yes | STRIPE_CARD \| BANK_TRANSFER |
| status | text | Yes | PENDING \| DEPOSIT_PAID \| PAID \| REFUNDED |
| notes | text | No | No Stripe charge id in MVP |

### vehicles

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | veh-sprinter |
| name | text | Yes | Mercedes-Benz Sprinter |
| plate | text | Yes unique | KMA123 |
| seats | integer | Yes | 8 or 4 · this is load capacity when assigned |
| notes | text | No | Assigned per departure, not bound to a product |

### drivers

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| id | text | PK | drv-peter |
| name | text | Yes | Peter |
| phone | text | Yes | Ops contact · phone not connected |
| licence | text | Yes | Class 2 |
| notes | text | No | Assigned per departure |

## D. Primary / foreign keys

| From | Column | To | Rule |
| --- | --- | --- | --- |
| routes | product_id | products.id | Required · RESTRICT delete |
| departures | product_id | products.id | Required · RESTRICT |
| departures | route_id | routes.id | Required · route.product_id must equal departure.product_id |
| departures | vehicle_id | vehicles.id | Nullable · SET NULL on vehicle delete |
| departures | driver_id | drivers.id | Nullable · SET NULL |
| bookings | customer_id | customers.id | Required · RESTRICT |
| bookings | departure_id | departures.id | Required · RESTRICT |
| payments | booking_id | bookings.id | Required unique · CASCADE with booking |

Unique: `bookings.booking_no`, `vehicles.plate`, `payments.booking_id`.

## E. One-to-many

Catalog and operations:

- One product → many routes (Mt Cook outbound and return).
- One product → many departures (Tue / Wed / Thu instances).
- One route → many departures on different dates.
- One vehicle → many departures (not at the same time in V2).
- One driver → many departures.

Commercial:

- One departure → many bookings.
- One customer → many bookings.
- One booking → one customer, one departure.
- One booking → one payment row in MVP.
- Confirmed booking passengers sum to Departure.booked.

## F. Mock data → future columns

Current code keeps denormalised strings. Database replaces those strings with FKs. Admin UI does not change in this design drop.

| Mock (now) | Table.column (later) | How |
| --- | --- | --- |
| MockDeparture.id | departures.id | Same slug |
| MockDeparture.product | departures.product_id → products.name | Stop storing product name on departure |
| MockDeparture.route | departures.route_id → routes.name | Stop storing route string |
| MockDeparture.destination | routes.destination | Moved onto route |
| MockDeparture.time | departures.departure_time | Rename |
| MockDeparture.returnTime | departures.return_time | Empty string → NULL |
| MockDeparture.pickup | departures.pickup_information | Rename |
| MockDeparture.serviceType | departures.service_type | Same enum |
| MockDeparture.status | departures.status | Operational enum only |
| MockDeparture.vehicleId / driverId | departures.vehicle_id / driver_id | `''` → NULL |
| MockDeparture.capacity | departures.capacity | Planned; load uses vehicle.seats |
| MockDeparture.name | departures.display_name | Ops label |
| InventoryStatus OPEN/FULL/DRAFT | (computed) | departureLoad() · not a column |
| booked / available | (computed) | SUM(bookings.passengers) where CONFIRMED |
| MockBooking.id / bookingNo | bookings.id / booking_no | Keep both |
| MockBooking.bookedOn | bookings.booking_date | Rename |
| MockBooking.pax | bookings.passengers | Rename |
| MockBooking.status | bookings.booking_status | Rename |
| MockBooking.product / serviceType | via departure_id | Do not duplicate catalog on booking |
| MockPayment.bookingNo | payments.booking_id | FK to bookings.id not booking_no |
| MockPayment.paidOn | payments.payment_date | Empty → NULL |
| MockCustomer.* | customers.* | Direct map |
| MockVehicle.seats | vehicles.seats | Effective capacity when assigned |
| vehicleType() | (computed) | seats ≤ 4 → airport van else shuttle van |

### MVP product and route seed (from current mock)

| Product | Service type | Routes in mock |
| --- | --- | --- |
| Mount Cook Shuttle | FIXED_SHUTTLE | Christchurch → Aoraki / Mt Cook · Aoraki / Mt Cook → Christchurch |
| Kaikoura Shuttle | FIXED_SHUTTLE | Christchurch → Kaikoura → Christchurch |
| Akaroa Shuttle | FIXED_SHUTTLE | Christchurch → Akaroa → Christchurch |
| Lyttelton Cruise Day Tour | CRUISE_DAY_TOUR | Lyttelton Port shore excursion |
| Akaroa Cruise Day Tour | CRUISE_DAY_TOUR | Akaroa Port shore excursion |
| Airport Transfer | AIRPORT_TRANSFER | Christchurch Airport → city hotels |

## G. Keep for V2 — not MVP tables or columns

Do not add these now. They are out of the eight-table MVP and out of the current Admin mock.

| Item | Why V2 |
| --- | --- |
| loyalty / membership / referral tables | Explicitly out of MVP |
| users / roles / JWT / RBAC | DP01 not started |
| price_lists / seasons / child rates | No pricing engine in mock |
| multi-currency | NZD only |
| ledger / invoices / payroll | Accounting later |
| passengers as person rows | MVP stores pax count + passenger_status on booking |
| multiple payments per booking | Mock is 1:1; deposit+balance split later |
| stripe_charge_id / webhooks | No Stripe |
| timetables / weekly_patterns table | Notes on departure are enough for now |
| inventory_status column | Derived OPEN/FULL; storing it would drift |
| booked / available columns | Must stay computed from bookings |
| vehicle bound to product | Mock assigns per departure |
| AI / marketing / CRM automation tables | Out of scope |
| native mobile session tables | Out of scope |

Next implementation step (not this drop): Prisma models matching these eight tables, still behind the Admin mock until you explicitly start the database package.
