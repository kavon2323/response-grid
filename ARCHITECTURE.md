# FireResponse MVP - Architecture & Build Plan

## Table of Contents

1. [Product & MVP Definition](#part-1-product--mvp-definition)
2. [Technical Architecture](#part-2-technical-architecture)
3. [Database Schema](#part-3-database-schema)
4. [Real-time Workflows](#part-4-real-time-workflows)
5. [Mobile App Screen Map](#part-5-mobile-app-screen-map)
6. [Admin Portal Modules](#part-6-admin-portal-modules)
7. [Security & Privacy Design](#part-7-security--privacy-design)
8. [Step-by-Step Build Plan](#part-8-step-by-step-build-plan)
9. [Repository Structure](#part-9-repository-structure)
10. [Starter Code Summary](#part-10-starter-code-summary)

---

## Part 1: Product & MVP Definition

### MVP Scope (8-10 weeks)

#### In Scope
- **Single department** with multi-department-ready data model
- **Push notification alerts** from CAD ingestion
- **Response status workflow**: Responding to Scene, Responding to Station, Not Responding
- **Real-time responder status** visibility for all users
- **GPS location tracking** for active responders
- **ETA calculation** and display
- **Basic apparatus selection** when at station
- **Inferred apparatus location** from driver GPS
- **Admin portal**: Incident view, responder tracking, basic reporting
- **Role-based access**: Volunteer, Lieutenant, Captain, Chief, Admin
- **Equipment inventory**: Basic CRUD operations

#### Deferred to Phase 2+
- Multi-department with mutual aid
- Advanced reporting dashboards and analytics
- Equipment expiration alerts/reminders
- Dedicated vehicle GPS hardware integration
- Offline mode with sync
- Advanced CAD integrations
- Shift scheduling
- Training records and certifications

### Core User Roles

| Role | Level | Capabilities |
|------|-------|--------------|
| Volunteer | 1 | View incidents, respond, update status |
| Lieutenant | 2 | + View all locations, manage equipment, view reports |
| Captain | 3 | + Same as Lieutenant with expanded scope |
| Chief | 4 | + Manage users, full administrative access |
| Admin | 5 | Non-operational admin, full system access |

---

## Part 2: Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                           │
│  CAD Systems → Webhook/Email → Edge Functions                    │
│  Apple Maps / Google Maps ← Device Native Handoff                │
│  Expo Push Notification Service                                   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │   Auth     │ │  Postgres  │ │  Realtime  │ │  Storage   │    │
│  │   + RLS    │ │  Database  │ │  Subscript.│ │  (photos)  │    │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      Edge Functions                         │  │
│  │  • cad-ingest     • send-push-notification                 │  │
│  │  • calculate-eta  • generate-report                        │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                    │                      │
        ┌───────────┴──────────┐           │
        ▼                      ▼           ▼
┌───────────────────┐  ┌─────────────────────────┐
│   MOBILE APP      │  │   ADMIN WEB PORTAL      │
│   (Expo/RN)       │  │   (Next.js 14)          │
├───────────────────┤  ├─────────────────────────┤
│ • Incident Alerts │  │ • Incident Dashboard    │
│ • Response Flow   │  │ • Live Map View         │
│ • GPS Tracking    │  │ • Member Management     │
│ • Apparatus Select│  │ • Reporting             │
│ • Status Updates  │  │ • Equipment Inventory   │
└───────────────────┘  └─────────────────────────┘
```

### Technology Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Mobile App | Expo SDK 52, React Native, TypeScript | Cross-platform, excellent push/location APIs |
| Navigation | Expo Router v4 | File-based routing, deep linking |
| Mobile State | Zustand + TanStack Query | Simple + server state caching |
| Admin Portal | Next.js 14 (App Router) | RSC, excellent for dashboards |
| Backend | Supabase | Real-time, auth, RLS, fast MVP |
| Database | PostgreSQL + PostGIS | Spatial queries, proven reliability |
| Maps (Mobile) | react-native-maps | Native performance |
| Maps (Admin) | Mapbox GL JS | Rich visualization |
| Push | Expo Push Service | Managed, reliable |

---

## Part 3: Database Schema

### Entity Relationship Overview

```
departments
    ├── stations
    ├── users
    │   └── incident_responses
    │       └── responder_locations
    ├── incidents
    │   ├── incident_responses
    │   └── apparatus_assignments
    ├── apparatus
    │   └── apparatus_assignments
    ├── cad_sources
    │   └── cad_raw_logs
    └── equipment
        └── equipment_logs
```

### Key Tables

#### Core Entities
- **departments**: Multi-tenant container
- **stations**: Physical fire stations with geofence data
- **users**: Members with role, push token, privacy settings

#### Incident Management
- **incidents**: Normalized CAD data with status tracking
- **incident_responses**: Per-user response to an incident
- **responder_locations**: Real-time GPS breadcrumbs
- **response_status_log**: Audit trail of status changes

#### Apparatus
- **apparatus**: Vehicles with inferred location support
- **apparatus_assignments**: Vehicle dispatch records

#### Equipment
- **equipment_categories**: SCBA, medical, PPE, etc.
- **equipment**: Individual items with expiration tracking
- **equipment_logs**: Maintenance/inspection history

#### System
- **cad_sources**: CAD integration configurations
- **cad_raw_logs**: Raw payload audit trail
- **audit_logs**: System-wide action log
- **notification_logs**: Push delivery tracking

### Row Level Security

All tables implement RLS with:
- Department isolation (users only see their department)
- Role-based data access
- Privacy-aware location sharing

---

## Part 4: Real-time Workflows

### Incident Alert Flow

```
1. CAD System → POST /functions/v1/cad-ingest
2. Edge Function:
   a. Log raw payload
   b. Normalize to incident format
   c. Create incident record
   d. Create pending responses for all active members
   e. Trigger push notifications
3. Mobile App:
   a. Receives push notification
   b. User taps → opens incident screen
   c. Subscribes to realtime updates
4. Realtime:
   a. All clients receive incident updates
   b. Response status changes broadcast immediately
```

### Response Status Flow

```
User Action          → Database Update        → Realtime Broadcast
─────────────────────────────────────────────────────────────────
Tap "Responding"     → incident_responses     → All subscribers
                       .status = 'responding'   see update
                     → response_status_log
                       (audit entry)

Location Update      → responder_locations    → Command users
                       (new row)                see map update
                     → incident_responses
                       .current_eta_minutes
```

### Apparatus Selection Flow

```
1. User status = 'arrived_station'
2. App checks if user is within station geofence
3. If yes: show available apparatus at this station
4. User selects apparatus → creates apparatus_assignment
5. Apparatus status → 'dispatched'
6. User's GPS now infers apparatus location
7. Command sees apparatus on map with inferred position
```

---

## Part 5: Mobile App Screen Map

### Navigation Structure

```
app/
├── _layout.tsx              # Root layout with auth check
├── auth/
│   └── sign-in.tsx          # Login screen
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Alerts tab (incident list)
│   ├── status.tsx           # My Status tab
│   ├── map.tsx              # Live Map tab (command only)
│   └── settings.tsx         # Settings tab
└── incident/
    └── [id].tsx             # Incident detail + response actions
```

### Screen Details

#### Alerts Tab
- Pull-to-refresh incident list
- Priority badges, time ago
- Active incidents highlighted
- Tap to open incident detail

#### Incident Detail
- Priority header with incident type
- Address with one-tap directions
- Map preview with incident marker
- Response action buttons:
  - Responding to Scene (red)
  - Responding to Station (yellow)
  - Not Responding (gray)
- Status progression buttons (contextual)
- Responders list grouped by destination
- Incident details section

#### Status Tab
- Profile card with name/role
- Active response card (if responding)
- Location sharing toggles
- Quick stats (placeholder for MVP)

#### Map Tab (Command Only)
- Full-screen Mapbox map
- Incident markers (red pins)
- Responder markers (colored by status)
- Callouts with ETA and details
- Active incident banner

#### Settings Tab
- Account info
- Privacy toggles
- Notification test
- About/version
- Sign out

---

## Part 6: Admin Portal Modules

### Dashboard
- Stats grid: Active incidents, today's calls, members, apparatus
- Active incidents card with responder counts
- Active responders sidebar
- Recent activity feed

### Live Map (Planned)
- Mapbox GL with real-time updates
- Incident and responder markers
- Apparatus positions
- Click-to-detail popups

### Incidents Module
- List with filters (date, status, type)
- Detail view with timeline
- Responder breakdown
- Apparatus assignments

### Members Module
- List with role badges
- Invite/edit/deactivate
- Response stats per member

### Apparatus Module
- List by station
- Status management
- Assignment history

### Equipment Module
- Inventory list
- Filter by category/status
- Add/edit items
- Inspection log

### Reports Module (Phase 2)
- Response rate by member
- Calls by type/time
- Apparatus utilization
- Exportable data

---

## Part 7: Security & Privacy Design

### Authentication
- Supabase Auth with email/password
- JWT tokens stored in Expo SecureStore
- Session auto-refresh
- Service role key for edge functions only

### Authorization (RBAC)
- Role stored in users table
- RLS policies check role via helper functions
- Command level = Lieutenant, Captain, Chief, Admin
- Volunteer sees own data + permitted shared data

### Location Privacy

| Data | Who Can See | Retention |
|------|-------------|-----------|
| Active response location | Command (always), Responders (if user allows) | 24 hours |
| Historical locations | Admin only, for audit | 30 days |
| Inferred apparatus location | All authenticated | Until returned |

User controls:
- `share_location_with_command`: Boolean, default true
- `share_location_with_responders`: Boolean, default true

### Data Protection
- All traffic over HTTPS
- Push tokens stored server-side only
- Raw CAD payloads logged for audit
- No PII in client logs

### Audit Trail
- `audit_logs` table captures:
  - Incident creation/updates
  - User role changes
  - Equipment changes
  - System configuration changes

### Failure Modes

| Scenario | Mitigation |
|----------|------------|
| Push delivery failure | Log error, retry queue (Phase 2), SMS fallback (Phase 2) |
| CAD webhook down | Retry logic, manual incident creation in admin |
| GPS unavailable | Skip location update, keep last known |
| Offline mobile | Queue status updates locally, sync on reconnect (Phase 2) |

---

## Part 8: Step-by-Step Build Plan

### Phase 1: Foundation (Weeks 1-2)

#### Week 1
- [ ] Set up monorepo structure
- [ ] Create Supabase project
- [ ] Apply database migrations
- [ ] Configure Supabase Auth
- [ ] Set up Expo project with navigation
- [ ] Implement sign-in flow

#### Week 2
- [ ] Create shared types package
- [ ] Implement auth store (Zustand)
- [ ] Build basic tab navigation
- [ ] Create admin portal scaffold
- [ ] Set up Supabase clients (mobile + web)

### Phase 2: Core Incident Flow (Weeks 3-4)

#### Week 3
- [ ] Build CAD ingestion edge function
- [ ] Create incident list screen
- [ ] Implement incident detail screen
- [ ] Build response action buttons
- [ ] Set up real-time subscriptions

#### Week 4
- [ ] Send push notifications
- [ ] Handle notification deep links
- [ ] Build admin incident dashboard
- [ ] Implement responder status display
- [ ] Create status progression workflow

### Phase 3: GPS & Mapping (Weeks 5-6)

#### Week 5
- [ ] Implement location service
- [ ] Configure background location tracking
- [ ] Build location update pipeline
- [ ] Create ETA calculation function

#### Week 6
- [ ] Add map to incident detail
- [ ] Build command map tab
- [ ] Display responder markers real-time
- [ ] Implement directions handoff

### Phase 4: Apparatus & Admin (Weeks 7-8)

#### Week 7
- [ ] Build apparatus selection flow
- [ ] Implement station geofencing
- [ ] Create inferred location logic
- [ ] Display apparatus on map

#### Week 8
- [ ] Build admin members module
- [ ] Create admin apparatus module
- [ ] Implement basic reporting
- [ ] Build equipment inventory CRUD

### Phase 5: Polish & Testing (Weeks 9-10)

#### Week 9
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Loading states and empty states

#### Week 10
- [ ] Security audit
- [ ] Documentation
- [ ] TestFlight / Play Store internal testing
- [ ] Final bug fixes

---

## Part 9: Repository Structure

```
fireresponse-mvp/
├── package.json              # Workspace root
├── .env.example              # Environment variables template
├── ARCHITECTURE.md           # This document
│
├── packages/
│   ├── shared/               # Shared types and constants
│   │   ├── package.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── database.ts
│   │       │   └── index.ts
│   │       ├── constants/
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── mobile/               # Expo React Native app
│   │   ├── package.json
│   │   ├── app.json
│   │   ├── tsconfig.json
│   │   ├── app/              # Expo Router screens
│   │   │   ├── _layout.tsx
│   │   │   ├── auth/
│   │   │   ├── (tabs)/
│   │   │   └── incident/
│   │   ├── src/
│   │   │   ├── lib/          # Supabase client
│   │   │   ├── stores/       # Zustand stores
│   │   │   ├── services/     # Location, notifications
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── components/   # Reusable components
│   │   └── assets/
│   │
│   └── admin/                # Next.js admin portal
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── providers.tsx
│       │   ├── globals.css
│       │   └── (dashboard)/
│       ├── components/
│       │   ├── Sidebar.tsx
│       │   ├── Header.tsx
│       │   └── dashboard/
│       └── lib/
│           └── supabase/
│
└── supabase/
    ├── config.toml           # Local dev config
    ├── migrations/
    │   └── 00001_initial_schema.sql
    └── functions/
        ├── cad-ingest/
        ├── send-push-notification/
        └── calculate-eta/
```

---

## Part 10: Starter Code Summary

### What's Been Created

#### Database
- Full PostgreSQL schema with 17+ tables
- Comprehensive enum types
- Row Level Security policies
- Helper functions for role checks
- PostGIS for spatial queries
- Audit logging infrastructure

#### Shared Package
- TypeScript types for all entities
- Response status configuration
- Priority configuration
- Role configuration
- Location/timing constants

#### Mobile App
- Expo Router navigation structure
- Supabase client with secure storage
- Auth store (sign in, sign out, profile)
- Incident store (load, subscribe, update status)
- Location service (foreground/background tracking)
- Notification service (registration, handlers)
- All main screens scaffolded

#### Admin Portal
- Next.js 14 App Router structure
- Supabase server/client setup
- Dashboard layout with sidebar
- Stats grid component
- Active incidents card
- Responders card
- Activity feed

#### Edge Functions
- CAD ingestion with normalization
- Push notification sending via Expo
- ETA calculation with Mapbox fallback

### Next Steps to Run

1. **Create Supabase project** at supabase.com
2. **Copy environment variables** from `.env.example`
3. **Apply migrations**: `supabase db push`
4. **Install dependencies**: `npm install`
5. **Run mobile**: `npm run mobile`
6. **Run admin**: `npm run admin`
7. **Deploy functions**: `npm run functions:deploy`

---

## Appendix: CAD Integration Specification

### Webhook Payload Format

```json
{
  "incident_id": "CAD-2024-001234",
  "incident_type": "Structure Fire",
  "incident_type_code": "SF",
  "priority": "high",
  "address": "123 Main Street",
  "address2": "Apt 4B",
  "city": "Hillside",
  "state": "NY",
  "zip": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "cross_street": "Oak Ave",
  "description": "Smoke visible from second floor",
  "caller_name": "John Smith",
  "caller_phone": "555-1234",
  "notes": "Caller states occupants evacuated",
  "timestamp": "2024-03-20T14:30:00Z"
}
```

### Authentication
- API key in `X-CAD-Source-Key` header
- Key validated against `cad_sources.config`

### Response

```json
{
  "success": true,
  "incident_id": "uuid",
  "members_notified": 45
}
```
