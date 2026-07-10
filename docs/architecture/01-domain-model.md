# Business Domain Model

> **Phase:** 1 — Business Domain  
> **Status:** Approved — Pre-Implementation  
> **Project:** PondDesk Fish Farm Management Platform

Business-first domain model for commercial fish farm operations. No persistence or API contracts at this layer.

## Related Documents

- [Database Architecture](./02-database-architecture.md) — Phase 2 persistence design
- [API Contract](./03-api-contract.md) — Phase 3 REST specification
- [Backend Architecture](./04-backend-architecture.md) — Phase 4 application blueprint
- [Domain Diagram](../diagrams/domain-value-chain.md) — Visual domain overview

---

## Table of Contents

  - [Business Domain Architecture Document](#business-domain-architecture-document)
  - [1. Complete Domain Model](#1-complete-domain-model)
    - [1.1 Organizational & Access Layer](#11-organizational-access-layer)
    - [1.2 Production Infrastructure Layer](#12-production-infrastructure-layer)
    - [1.3 Core Production Layer](#13-core-production-layer)
    - [1.4 Supply Chain & Inventory Layer](#14-supply-chain-inventory-layer)
    - [1.5 Commercial & Financial Layer](#15-commercial-financial-layer)
    - [1.6 Insight & Communication Layer](#16-insight-communication-layer)
  - [2. Entity Relationship Tree](#2-entity-relationship-tree)
    - [Relationship Semantics](#relationship-semantics)
  - [3. Business Rules](#3-business-rules)
    - [3.1 Structural Rules (Existence & Integrity)](#31-structural-rules-existence-integrity)
    - [3.2 Quantity & Capacity Rules](#32-quantity-capacity-rules)
    - [3.3 Temporal Rules](#33-temporal-rules)
    - [3.4 State Transition Rules](#34-state-transition-rules)
    - [3.5 Policy Rules (Farm-Configurable)](#35-policy-rules-farm-configurable)
    - [3.6 Financial Rules](#36-financial-rules)
  - [4. Business Workflows](#4-business-workflows)
    - [4.1 Stock Fish (Fingerling Intake)](#41-stock-fish-fingerling-intake)
    - [4.2 Purchase Feed](#42-purchase-feed)
    - [4.3 Feed Fish (Daily Operations)](#43-feed-fish-daily-operations)
    - [4.4 Record Water Quality](#44-record-water-quality)
    - [4.5 Transfer Batch](#45-transfer-batch)
    - [4.6 Record Mortality](#46-record-mortality)
    - [4.7 Harvest Fish](#47-harvest-fish)
    - [4.8 Generate Reports](#48-generate-reports)
  - [5. Domain Events](#5-domain-events)
  - [6. Fish Batch Lifecycle](#6-fish-batch-lifecycle)
    - [Information Generated Per Stage](#information-generated-per-stage)
  - [7. Validation Rules](#7-validation-rules)
    - [7.1 Population & Biomass](#71-population-biomass)
    - [7.2 Dates & Time](#72-dates-time)
    - [7.3 Water Parameters (Realistic Ranges)](#73-water-parameters-realistic-ranges)
    - [7.4 Feed & Inventory](#74-feed-inventory)
    - [7.5 State & Policy](#75-state-policy)
    - [7.6 Financial](#76-financial)
    - [7.7 Identity & Access](#77-identity-access)
  - [8. Recommended Bounded Contexts](#8-recommended-bounded-contexts)
    - [Context Responsibilities](#context-responsibilities)
    - [Extensibility Principles](#extensibility-principles)
  - [Architectural Summary](#architectural-summary)

---


## 1. Complete Domain Model

The domain is organized around **one primary value chain**: convert fingerlings into harvestable biomass through controlled pond operations, while managing inputs (feed, water, labor), outputs (harvest, sales), and farm economics.

### 1.1 Organizational & Access Layer

#### **Farm**
| Aspect | Description |
|--------|-------------|
| **Represents** | The legal and operational unit of production — a commercial fish farming business or site. |
| **Why it exists** | All aquaculture activity is scoped to a farm. Policies, units, ponds, and reporting roll up here. |
| **Owns** | Name, location, timezone, measurement preferences, operational policies (e.g., max batches per pond), contact details, license/regulatory identifiers. |
| **Actions** | Create/update profile, configure policies, view consolidated performance, manage users, export data. |
| **Interacts with** | Pond, User, Vendor, Customer, Report, Settings, Expense, Notification. |

#### **User**
| Aspect | Description |
|--------|-------------|
| **Represents** | A person who operates or oversees the farm (owner, manager, technician, accountant). |
| **Why it exists** | Operations are human-driven; accountability and permissions require identifiable actors. |
| **Owns** | Identity (name, contact), credentials, assigned role(s), activity attribution. |
| **Actions** | Log in, record operations, approve harvests, generate reports, configure preferences. |
| **Interacts with** | Farm, Role, every operational record (as recorder/approver). |

#### **Role**
| Aspect | Description |
|--------|-------------|
| **Represents** | A bundle of permissions defining what a user may see and do. |
| **Why it exists** | Commercial farms separate field work from management and finance. |
| **Owns** | Permission set (e.g., record feeding, approve harvest, view financials). |
| **Actions** | Assign to users, define access boundaries. |
| **Interacts with** | User, Farm (scoped permissions). |

#### **Settings**
| Aspect | Description |
|--------|-------------|
| **Represents** | Configurable behavior and preferences for farm and users. |
| **Why it exists** | Farms differ in species mix, units, alert thresholds, and notification preferences. |
| **Owns** | Notification rules, alert thresholds, date/time formats, theme, data retention preferences. |
| **Actions** | Update preferences, export data, trigger account-level actions. |
| **Interacts with** | Farm, User, Notification. |

---

### 1.2 Production Infrastructure Layer

#### **Pond**
| Aspect | Description |
|--------|-------------|
| **Represents** | A discrete production unit — earthen pond, concrete tank, cage, or raceway where fish are grown. |
| **Why it exists** | Fish are grown in physical enclosures with capacity, water, and environmental constraints. |
| **Owns** | Name/identifier, type, dimensions/volume, max stocking capacity, water source, aeration equipment flag, operational status (active, drained, maintenance). |
| **Actions** | Create, update, drain, prepare for stocking, view status/history, link to current batch. |
| **Interacts with** | Farm, Fish Batch, Water Record, Feeding (via batch), Mortality, Harvest. |

#### **Species**
| Aspect | Description |
|--------|-------------|
| **Represents** | A biological classification of fish being cultivated (e.g., African Catfish, Nile Tilapia). |
| **Why it exists** | Feeding regimes, water tolerances, growth expectations, and market value vary by species. |
| **Owns** | Name, optimal water parameter ranges, typical FCR benchmarks, market notes. |
| **Actions** | Define/reference in batches, apply species-specific thresholds. |
| **Interacts with** | Fish Batch, Water Record (interpretation), Feed type recommendations. |

---

### 1.3 Core Production Layer

#### **Fish Batch**
| Aspect | Description |
|--------|-------------|
| **Represents** | A cohort of fish stocked together, tracked as one production unit from stocking to harvest or closure. |
| **Why it exists** | Commercial farms manage economics and biology at batch level — not individual fish. |
| **Owns** | Batch ID, species, stocking date, initial count, current count, source (hatchery/vendor), initial average weight, current estimated weight, growth stage, status (planned, active, harvested, closed, written-off), target harvest date, notes. |
| **Actions** | Stock, transfer between ponds, record weight samples, record mortality, adjust count (with reason), schedule harvest, close. |
| **Interacts with** | Pond, Species, Feeding, Mortality, Water Record (indirect), Harvest, Vendor (fingerling source), Expense (stocking cost). |

#### **Feeding**
| Aspect | Description |
|--------|-------------|
| **Represents** | A single feeding event — feed applied to a batch on a specific date/time. |
| **Why it exists** | Feed is the largest cost input and primary growth driver; daily discipline is essential. |
| **Owns** | Date/time, batch, feed type, quantity, feeding method (manual/automatic), recorded by, weather context, notes. |
| **Actions** | Record, edit (within policy window), void (with reason), mark as missed/skipped. |
| **Interacts with** | Fish Batch, Feed Inventory (consumption), Pond (location), User, Expense (implicit cost allocation). |

#### **Mortality Record**
| Aspect | Description |
|--------|-------------|
| **Represents** | Death loss in a batch, recorded with count and suspected cause. |
| **Why it exists** | Survival rate drives profitability; unexplained mortality triggers intervention. |
| **Owns** | Date, batch, count, cause category (disease, water stress, predation, handling, unknown), notes, recorded by. |
| **Actions** | Record, investigate, annotate. |
| **Interacts with** | Fish Batch (reduces count), Pond, Water Record (correlation), Notification (threshold alerts). |

#### **Water Record**
| Aspect | Description |
|--------|-------------|
| **Represents** | A measurement snapshot of pond water quality at a point in time. |
| **Why it exists** | Water quality determines fish stress, feeding efficiency, and survival. |
| **Owns** | Date/time, pond, temperature, pH, dissolved oxygen, ammonia, nitrite, nitrate, turbidity, water level/depth, color, weather, health status interpretation, recorded by, optional photo/sensor source. |
| **Actions** | Record manually, import from sensor, review trends, flag alerts. |
| **Interacts with** | Pond (primary), Farm (thresholds), Notification, Report. **Not** directly owned by batch — water is a pond property. |

#### **Harvest**
| Aspect | Description |
|--------|-------------|
| **Represents** | Removal of fish from a batch for sale or partial sale — full or partial harvest. |
| **Why it exists** | Harvest is the revenue realization event; it closes or reduces a production cycle. |
| **Owns** | Date, batch, pond, count harvested, average weight, total weight, buyer/customer, price per kg, notes, harvest type (partial/full), recorded by. |
| **Actions** | Plan, execute, record, edit (pre-finalization), finalize, link to sale. |
| **Interacts with** | Fish Batch, Pond, Customer, Sale, Notification, Report. |

---

### 1.4 Supply Chain & Inventory Layer

#### **Feed Inventory**
| Aspect | Description |
|--------|-------------|
| **Represents** | Current stock of feed on the farm, by feed type/brand/size. |
| **Why it exists** | Feed outages halt operations; overstocking ties up capital. |
| **Owns** | Feed type, brand, pellet size, quantity on hand, unit, reorder level, storage location, last updated. |
| **Actions** | Receive stock, consume (via feeding), adjust (spoilage/correction), set reorder alerts. |
| **Interacts with** | Feed Purchase, Feeding, Vendor, Expense, Notification. |

#### **Feed Purchase**
| Aspect | Description |
|--------|-------------|
| **Represents** | An acquisition of feed from a supplier — order or delivery event. |
| **Why it exists** | Links cost to inventory replenishment for financial traceability. |
| **Owns** | Date, vendor, feed type, quantity, unit price, total cost, delivery reference, payment status. |
| **Actions** | Record purchase, receive delivery, reconcile against invoice. |
| **Interacts with** | Vendor, Feed Inventory, Expense. |

#### **Vendor**
| Aspect | Description |
|--------|-------------|
| **Represents** | An external supplier — fingerlings, feed, chemicals, equipment. |
| **Why it exists** | Commercial farms source inputs from multiple suppliers; history informs purchasing decisions. |
| **Owns** | Name, contact, category (fingerling, feed, chemical, equipment), payment terms, reliability notes. |
| **Actions** | Add, update, deactivate, view purchase history. |
| **Interacts with** | Feed Purchase, Fish Batch (fingerling source), Expense. |

---

### 1.5 Commercial & Financial Layer

#### **Customer**
| Aspect | Description |
|--------|-------------|
| **Represents** | A buyer of harvested fish — market, distributor, restaurant, individual. |
| **Why it exists** | Harvest records need commercial counterparties; repeat buyers are tracked. |
| **Owns** | Name, contact, location, payment terms, purchase history summary. |
| **Actions** | Add, update, view history. |
| **Interacts with** | Harvest, Sale. |

#### **Sale**
| Aspect | Description |
|--------|-------------|
| **Represents** | A commercial transaction arising from harvest — revenue event. |
| **Why it exists** | Separates biological harvest from financial settlement (price negotiation, payment timing). |
| **Owns** | Date, customer, linked harvest(s), quantity, weight, unit price, total amount, payment status, delivery terms. |
| **Actions** | Create from harvest, record payment, void (with audit). |
| **Interacts with** | Harvest, Customer, Expense (net margin context), Report. |

#### **Expense**
| Aspect | Description |
|--------|-------------|
| **Represents** | Money spent on farm operations not captured elsewhere, or explicit cost allocation. |
| **Why it exists** | Profitability requires cost visibility beyond feed alone (labor, chemicals, fuel, repairs). |
| **Owns** | Date, category, amount, description, linked entity (optional: vendor, pond, batch), recorded by. |
| **Actions** | Record, categorize, allocate to batch/pond, report. |
| **Interacts with** | Farm, Vendor, Feed Purchase, Fish Batch (cost per kg analysis). |

---

### 1.6 Insight & Communication Layer

#### **Report**
| Aspect | Description |
|--------|-------------|
| **Represents** | A generated snapshot of farm data for a time period or entity — operational or management view. |
| **Why it exists** | Owners, investors, and regulators need periodic summaries without navigating daily records. |
| **Owns** | Type, date range, scope (farm/pond/batch), format, generation timestamp, generated by, status. |
| **Actions** | Generate, download, archive, schedule (future). |
| **Interacts with** | Nearly all operational entities as data sources. |

#### **Notification**
| Aspect | Description |
|--------|-------------|
| **Represents** | An alert or reminder requiring human attention. |
| **Why it exists** | Farms cannot rely on managers checking dashboards constantly; proactive alerts prevent losses. |
| **Owns** | Type, severity, message, related entity, timestamp, read/dismissed state, recipient. |
| **Actions** | Trigger, deliver, acknowledge, dismiss, configure preferences. |
| **Interacts with** | Water Record, Feed Inventory, Feeding, Mortality, Harvest, Settings. |

---

## 2. Entity Relationship Tree

```
Farm (1)
├── Users (many) ──assigned──▶ Role (many)
├── Settings (1 per farm / per user preferences)
├── Ponds (many)
│   ├── current Fish Batch (0..1 active, policy-dependent)
│   ├── historical Fish Batches (many over time)
│   ├── Water Records (many) ── belong to Pond only
│   └── Pond Status / Equipment metadata
│
├── Fish Batches (many, scoped to farm; physically in one Pond at a time)
│   ├── Species (1 reference)
│   ├── Fingerling Vendor (0..1, at stocking)
│   ├── Feeding Records (many)
│   ├── Mortality Records (many)
│   ├── Weight/Growth Samples (many, optional entity)
│   ├── Harvest Records (many; partial harvests allowed)
│   └── Batch Lifecycle State (intrinsic)
│
├── Feed Inventory (many line items by feed type)
│   └── consumed by ──▶ Feeding Records
│
├── Feed Purchases (many)
│   ├── Vendor (1)
│   └── increases ──▶ Feed Inventory
│
├── Vendors (many)
├── Customers (many)
│
├── Harvests (many)
│   ├── Fish Batch (1)
│   ├── Pond (1, denormalized for reporting)
│   └── Customer (0..1)
│       └── may produce ──▶ Sale (0..1)
│
├── Sales (many)
│   └── Customer (1)
│
├── Expenses (many)
│   └── optional links to Vendor, Pond, Batch, Purchase
│
├── Reports (many)
└── Notifications (many)
```

### Relationship Semantics

| Relationship | Cardinality | Meaning |
|-------------|-------------|---------|
| Farm → Pond | 1:N | Every pond belongs to exactly one farm. |
| Pond → Fish Batch (active) | 1:0..1 | A pond holds at most one active batch (default commercial policy). |
| Pond → Fish Batch (historical) | 1:N | Over years, many batches occupy the same pond sequentially. |
| Fish Batch → Pond | N:1 | A batch resides in exactly one pond at any moment; may transfer. |
| Fish Batch → Species | N:1 | Each batch is one species. |
| Fish Batch → Feeding | 1:N | Many daily feedings per batch. |
| Fish Batch → Mortality | 1:N | Losses accumulate over the grow-out period. |
| Fish Batch → Harvest | 1:N | Partial harvests possible before full closure. |
| Pond → Water Record | 1:N | Water is environmental, not batch-specific. |
| Feeding → Feed Inventory | N:1 | Each feeding consumes from a specific inventory line. |
| Feed Purchase → Feed Inventory | N:1 | Purchases increase stock of a feed type. |
| Feed Purchase → Vendor | N:1 | Every purchase has a supplier. |
| Harvest → Customer | N:0..1 | Buyer may be recorded at harvest time. |
| Harvest → Sale | 1:0..1 | Financial settlement may follow harvest. |
| User → operational records | 1:N | Users are recorders/approvers, not owners of fish. |
| Notification → any entity | N:1 | Alerts reference the triggering object. |

---

## 3. Business Rules

### 3.1 Structural Rules (Existence & Integrity)

1. **A Fish Batch cannot exist without a Pond** — stocking is always into a physical enclosure.
2. **A Fish Batch must reference exactly one Species** — mixed-species batches are out of scope unless explicitly modeled as polyculture (future).
3. **A Water Record belongs to a Pond, never directly to a Batch** — water is shared environment; batches in the same pond share water quality.
4. **A Feeding always targets a Fish Batch** — feed is applied to a cohort, not empty water.
5. **A Harvest always references a Fish Batch and its current Pond** — even if transfer occurred historically, harvest is recorded at time of removal.
6. **A Feed Purchase must reference a Vendor and a Feed type** — anonymous purchases break cost traceability.
7. **Every operational record must attribute a User** — audit trail is non-negotiable in commercial operations.

### 3.2 Quantity & Capacity Rules

8. **Fish count cannot be negative** at any point in a batch lifecycle.
9. **Mortality automatically reduces current fish count** by the recorded amount.
10. **Harvest count cannot exceed current fish count** at time of harvest.
11. **Partial harvest reduces count but does not close the batch** unless explicitly marked full harvest.
12. **Full harvest closes the batch** — status transitions to harvested/closed; no further feedings allowed.
13. **Pond stocking cannot exceed maximum capacity** — defined by farm policy (fish count or biomass kg/m³).
14. **Feed quantity in a feeding must be positive** — zero-quantity feedings are invalid (use "skipped" event instead).
15. **Feed inventory cannot go negative** — consumption blocked or triggers override with manager approval.

### 3.3 Temporal Rules

16. **Harvest date cannot precede stocking date** for the same batch.
17. **Mortality date cannot precede stocking date.**
18. **Feeding date cannot precede stocking date.**
19. **Water records may exist before a batch is stocked** — pond preparation phase is valid.
20. **Batch transfer preserves identity** — same batch ID, new pond, transfer date recorded.

### 3.4 State Transition Rules

21. **Only active batches accept feedings, mortality, and harvests.**
22. **Closed batches are read-only** except for financial reconciliation notes.
23. **A pond in maintenance/drained status cannot receive new stock** until returned to active.
24. **Planned batches cannot consume feed inventory** until stocked (status = active).

### 3.5 Policy Rules (Farm-Configurable)

25. **One active batch per pond** — default; some farms allow polyculture (future policy flag).
26. **Feeding edits allowed only within N hours** — prevents historical manipulation.
27. **Mortality above X% in 24 hours triggers mandatory notification.**
28. **Water parameter outside species threshold triggers alert severity escalation.**
29. **Feed inventory below reorder level triggers low-stock notification.**

### 3.6 Financial Rules

30. **Feed Purchase increases inventory and records expense** (or accounts payable).
31. **Harvest does not automatically create Sale** — biological and commercial events are separable.
32. **Sale amount = weight × price per kg** (unless contract pricing overrides).

---

## 4. Business Workflows

### 4.1 Stock Fish (Fingerling Intake)

| | |
|--|--|
| **Trigger** | Fingerlings arrive from hatchery/vendor; pond is prepared. |
| **Steps** | 1. Verify pond status (active, empty or policy-compliant). 2. Create Fish Batch (species, vendor, initial count, avg weight, stocking date). 3. Assign batch to pond. 4. Optionally record stocking expense. 5. Set batch status = active. |
| **Validation** | Pond capacity not exceeded; count > 0; stocking date ≤ today; vendor valid. |
| **Outcome** | Active batch in pond; baseline population established; grow-out cycle begins. |

### 4.2 Purchase Feed

| | |
|--|--|
| **Trigger** | Feed delivery arrives or purchase order fulfilled. |
| **Steps** | 1. Select/create Vendor. 2. Record Feed Purchase (type, qty, price). 3. Increase Feed Inventory. 4. Record Expense. 5. Evaluate reorder alert clearance. |
| **Validation** | Quantity > 0; price ≥ 0; feed type exists in catalog. |
| **Outcome** | Inventory increased; cost captured; farm can continue feeding. |

### 4.3 Feed Fish (Daily Operations)

| | |
|--|--|
| **Trigger** | Scheduled feeding time; worker at pond side. |
| **Steps** | 1. Select batch (often via pond). 2. Select feed type from inventory. 3. Enter quantity and time. 4. System deducts inventory. 5. Record attributed to user. |
| **Validation** | Batch active; inventory sufficient; quantity > 0; not future-dated beyond tolerance. |
| **Outcome** | Feeding recorded; inventory reduced; feeding compliance visible on dashboard. |

### 4.4 Record Water Quality

| | |
|--|--|
| **Trigger** | Daily test routine, post-rain inspection, or sensor reading. |
| **Steps** | 1. Select pond. 2. Enter parameters (manual or sensor import). 3. System evaluates against species/farm thresholds. 4. Assign health status. 5. Trigger alerts if critical. |
| **Validation** | Realistic parameter ranges; pond exists and is operational; timestamp valid. |
| **Outcome** | Water Record stored; pond health visible; alerts may fire. |

### 4.5 Transfer Batch

| | |
|--|--|
| **Trigger** | Pond maintenance, grading, or capacity management. |
| **Steps** | 1. Select active batch. 2. Select destination pond. 3. Confirm destination capacity. 4. Record transfer date and reason. 5. Update batch pond assignment; close source pond occupancy. |
| **Validation** | Both ponds active; destination not over capacity; batch is active. |
| **Outcome** | Batch history shows pond lineage; water records remain pond-scoped. |

### 4.6 Record Mortality

| | |
|--|--|
| **Trigger** | Dead fish observed during feeding or inspection. |
| **Steps** | 1. Select batch. 2. Enter count and cause. 3. System reduces current fish count. 4. Evaluate survival rate thresholds. 5. Notify if spike detected. |
| **Validation** | Count > 0; count ≤ current population; batch active. |
| **Outcome** | Population adjusted; survival metrics updated; possible alert. |

### 4.7 Harvest Fish

| | |
|--|--|
| **Trigger** | Batch reaches market size or partial market opportunity. |
| **Steps** | 1. Select batch. 2. Record count, avg weight, total weight. 3. Record buyer/customer and price. 4. Reduce batch fish count. 5. If full harvest → close batch, free pond. 6. Optionally create Sale. |
| **Validation** | Harvest ≤ current count; date ≥ stocking date; batch active. |
| **Outcome** | Revenue event captured; batch partially or fully closed; pond available if full harvest. |

### 4.8 Generate Reports

| | |
|--|--|
| **Trigger** | Manager needs daily/weekly/monthly summary or export. |
| **Steps** | 1. Select report type and scope. 2. Define date range and filters. 3. Aggregate operational data. 4. Render PDF/Excel/CSV. 5. Store report metadata. |
| **Validation** | Date range valid; scope entities exist. |
| **Outcome** | Shareable document; audit log of generation. |

---

## 5. Domain Events

Events are the **nervous system** of the domain — they describe what happened and what must react.

| Event | Payload Essence | Downstream Effects |
|-------|-------------------|-------------------|
| **Fish Batch Created** | batch, pond, species, initial count | Pond marked occupied; dashboard KPIs update; stocking baseline set. |
| **Fish Batch Stocked (Activated)** | batch, date | Grow-out clock starts; feeding schedule eligible. |
| **Fish Batch Transferred** | batch, from pond, to pond | Pond occupancy maps update; history chain extended. |
| **Feed Recorded** | batch, feed type, quantity | Inventory decreased; daily feeding compliance updated; FCR inputs updated. |
| **Feeding Missed** | batch, scheduled slot | Compliance gap flagged; notification optional. |
| **Feed Purchased** | vendor, feed type, quantity, cost | Inventory increased; expense recorded; reorder alert may clear. |
| **Inventory Below Reorder Level** | feed type, current qty | Notification to manager; dashboard warning. |
| **Water Test Recorded** | pond, parameters, status | Pond health updated; trend data extended; alert if critical. |
| **Water Alert Raised** | pond, parameter, severity | Notification dispatched; may suggest actions (aerate, exchange water). |
| **Mortality Recorded** | batch, count, cause | Fish count reduced; survival rate recalculated; spike detection. |
| **Weight Sample Recorded** | batch, avg weight, sample size | Growth curve updated; harvest readiness estimate adjusted. |
| **Harvest Completed** | batch, count, weight, type | Fish count reduced; batch may close; pond freed; revenue data available. |
| **Batch Closed** | batch, reason | No more feedings/mortality; historical archive mode. |
| **Sale Recorded** | harvest, customer, amount | Revenue finalized; customer history updated. |
| **Vendor Added** | vendor, category | Available for purchases and stocking source. |
| **Expense Recorded** | category, amount, links | Farm cost totals updated; batch economics if allocated. |
| **Report Generated** | type, scope, format | Audit entry; available for download. |
| **User Action (Audit)** | user, action, entity | Compliance trail; supports future role enforcement. |

---

## 6. Fish Batch Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FISH BATCH LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────────┘

  FINGERLINGS PURCHASED
  │  Information: vendor, species, count, size, cost, delivery date
  ▼
  BATCH PLANNED
  │  Information: target pond, expected stocking date, budgeted feed
  ▼
  STOCKED (ACTIVE)
  │  Information: stocking date, initial count, initial avg weight,
  │               pond assignment, survival baseline (100%)
  ▼
  ┌──────────────────────────────────────────────────┐
  │  GROW-OUT PHASE (repeating daily/weekly)         │
  │                                                  │
  │  FED DAILY                                       │
  │    → feeding records, feed consumption, FCR data │
  │                                                  │
  │  WATER MONITORED (pond-level)                    │
  │    → water records, health scores, alerts        │
  │                                                  │
  │  WEIGHT SAMPLED (periodic)                       │
  │    → growth rate, projected harvest date         │
  │                                                  │
  │  POSSIBLE MORTALITY                              │
  │    → count reduction, cause log, survival %      │
  │                                                  │
  │  POSSIBLE TRANSFER                               │
  │    → pond lineage, reason                        │
  └──────────────────────────────────────────────────┘
  ▼
  HARVEST READY (business state, not always formalized)
  │  Information: estimated weight, market window, buyer interest
  ▼
  HARVESTED (partial or full)
  │  Information: count/weight removed, buyer, price, revenue
  ▼
  BATCH CLOSED
     Information: final survival %, total feed used, FCR,
                  total mortality, total revenue, days in pond,
                  pond released for next cycle
```

### Information Generated Per Stage

| Stage | Key Metrics Produced |
|-------|---------------------|
| Stocking | Initial biomass, cost per fingerling, stocking density |
| Daily feeding | Cumulative feed kg, feeding compliance % |
| Water monitoring | Pond health trend, alert frequency |
| Growth sampling | ADG (average daily gain), size distribution estimate |
| Mortality | Survival rate, loss by cause category |
| Harvest | Yield kg, price/kg, partial vs full status |
| Closure | Batch ROI inputs: FCR, survival, days to harvest, revenue |

---

## 7. Validation Rules

### 7.1 Population & Biomass
- Fish count ≥ 0 at all times.
- Mortality count ≤ current fish count.
- Harvest count ≤ current fish count.
- Stocking count ≤ pond max capacity.
- Estimated biomass (count × avg weight) ≤ pond biomass limit (if configured).

### 7.2 Dates & Time
- Stocking date ≤ today (no future stocking without explicit planned status).
- Operational records (feed, mortality, harvest) ≥ stocking date for that batch.
- Harvest date ≥ stocking date.
- Edit window enforced per record type (farm policy).

### 7.3 Water Parameters (Realistic Ranges)
- Temperature: species-dependent (e.g., 20–35°C for tropical species; flag outside).
- pH: typically 6.0–9.0; critical outside 5.5–9.5.
- Dissolved oxygen: > 0 mg/L; alert < 4 mg/L for most species.
- Ammonia, nitrite: ≥ 0; critical above species thresholds.
- Turbidity, depth, level: non-negative.

### 7.4 Feed & Inventory
- Feed quantity > 0 per feeding event.
- Inventory consumption ≤ available stock (unless manager override).
- Purchase quantity > 0.

### 7.5 State & Policy
- No feeding on closed/planned-only batches.
- No two active batches on same pond (default policy).
- Pond must be active to receive stock.
- Full harvest requires count to reach 0 or explicit write-off of remainder.

### 7.6 Financial
- Price per kg ≥ 0.
- Expense amount > 0.
- Sale total consistent with weight × unit price (tolerance for rounding).

### 7.7 Identity & Access
- User must be authenticated to create operational records.
- Role must permit action (future enforcement).
- Farm scope: user cannot operate on another farm's entities.

---

## 8. Recommended Bounded Contexts

Bounded contexts divide the domain for **scalable team ownership** and **clean integration**. Each context has its own ubiquitous language and publishes events to others.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PONDDESK PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │  IDENTITY &      │    │  FARM            │    │  PRODUCTION      │   │
│  │  ACCESS          │    │  CONFIGURATION   │    │  OPERATIONS      │   │
│  │                  │    │                  │    │                  │   │
│  │  User, Role,     │    │  Farm, Settings, │    │  Pond, Batch,    │   │
│  │  Auth, Audit     │    │  Species, Policy │    │  Feeding,        │   │
│  │                  │    │                  │    │  Mortality,      │   │
│  └────────┬─────────┘    └────────┬─────────┘    │  Transfer        │   │
│           │                       │              └────────┬─────────┘   │
│           │                       │                       │             │
│  ┌────────┴─────────┐    ┌────────┴─────────┐    ┌────────┴─────────┐   │
│  │  ENVIRONMENTAL   │    │  SUPPLY CHAIN    │    │  COMMERCIAL      │   │
│  │  MONITORING      │    │  & INVENTORY     │    │  & FINANCE       │   │
│  │                  │    │                  │    │                  │   │
│  │  Water Record,   │    │  Feed Inventory, │    │  Harvest, Sale,  │   │
│  │  Alerts, Sensors │    │  Purchase,       │    │  Customer,       │   │
│  │  (future IoT)    │    │  Vendor          │    │  Expense         │   │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   ▼                                     │
│                    ┌──────────────────────────┐                         │
│                    │  INSIGHTS & COMMS        │                         │
│                    │  Report, Notification,   │                         │
│                    │  Dashboard (read model)  │                         │
│                    └──────────────────────────┘                         │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  FUTURE CONTEXTS (extension points)                               │   │
│  │  AI Analytics │ IoT Ingestion │ Multi-Farm │ Scheduling │ Orders │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Context Responsibilities

| Bounded Context | Owns | Publishes Events To |
|----------------|------|---------------------|
| **Identity & Access** | Authentication, authorization, audit | All contexts (user attribution) |
| **Farm Configuration** | Farm profile, species catalog, policies, settings | Production, Environmental, Supply Chain |
| **Production Operations** | Pond, Batch, Feeding, Mortality, Transfer, lifecycle | Inventory (feed consumption), Commercial (harvest readiness), Insights |
| **Environmental Monitoring** | Water Record, health scoring, alerts | Insights, Notifications; reads Pond from Production |
| **Supply Chain & Inventory** | Feed stock, purchases, vendors | Production (availability), Finance (cost), Insights |
| **Commercial & Finance** | Harvest, Sale, Customer, Expense | Insights; reads Batch from Production |
| **Insights & Communications** | Reports, notifications, dashboard aggregates | Read-only consumer of all operational events |

### Extensibility Principles

1. **Event-first integration** — New modules (IoT, AI) subscribe to domain events without modifying core aggregates.
2. **Pond vs Batch separation** — Water and environment stay pond-scoped; growth economics stay batch-scoped. IoT sensors attach to ponds, not batches.
3. **Harvest ≠ Sale** — Enables future accounting, contracts, and partial payments without rework.
4. **Farm as tenancy boundary** — Multi-farm is additive: new Farm IDs, not schema redesign.
5. **Policy objects over hard rules** — One-batch-per-pond, edit windows, and thresholds are configuration, not code branches.
6. **Read models for dashboard/reporting** — Heavy aggregation lives in Insights context; operational writes stay fast.
7. **External identifiers** — Vendors, customers, and sensor devices use stable external IDs for ERP and IoT integration later.

---

## Architectural Summary

A commercial fish farm platform is not a collection of forms — it is a **production system** with a clear causal chain:

**Stock → Grow (feed + water + survival) → Harvest → Sell → Analyze → Repeat.**

The domain model above treats **Fish Batch** as the economic unit, **Pond** as the physical and environmental unit, **Feed Inventory** as the critical supply constraint, and **Harvest** as the biological-to-commercial bridge. Water quality, mortality, and feeding are not isolated features — they are **inputs to survival and growth**, which determine whether a batch reaches profitable harvest.

This model supports the current PondDesk MVP modules (Dashboard, Ponds, Batches, Feedings, Inventory, Water Records, Harvest, Reports, Settings) and provides clean extension points for vendors, sales, expenses, IoT sensors, AI predictions, and multi-farm operations — without redesigning the core production spine.