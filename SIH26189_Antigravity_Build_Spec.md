# SIH 26189 — Criminal Intelligence Platform: Antigravity Build Spec

Use this as the master prompt/spec for Antigravity. Paste it in full at the start of the build, then reference individual sections as you build each part. Everything here is scoped deliberately tight — build only what's listed. Do not add extra pages, features, or "nice to have" additions beyond this spec.

---

## 1. Project Overview

Build "Criminal Intelligence Command Center" — a demo-grade but professionally built web app for SIH 26189, using Mumbai City as the pilot jurisdiction. It lets an investigator search cases/entities, view an entity's profile and connections, explore a knowledge graph of linked people/phones/vehicles/accounts, review AI-generated alerts, and compare crime MO (Modus Operandi) similarity across cases.

This is a working prototype for a hackathon demo — it must look and behave like real, professional software. It does not need production-grade security, multi-tenant auth, or real police data integration.

## 2. Tech Stack (fixed — do not substitute)

- React + Vite
- Tailwind CSS
- Supabase (Postgres + Auth) as the backend/database
- Recharts or a lightweight graph library (e.g. react-force-graph or vis-network) for the knowledge graph visualization
- No other backend framework, no separate Node/Express server unless Supabase edge functions are needed for a specific computed endpoint

## 3. Design System (locked — match exactly)

- Colors: deep navy (#0B1E3D), white (#FFFFFF), light grey (#F5F6F8) for section backgrounds, gold/amber (#D4A017) as the single accent for CTAs/highlights/confidence scores, muted red (#C0392B) reserved only for genuine high-severity alerts
- Typography: bold sans-serif headings (uppercase tracking for nav/section labels), clean sans-serif body (Inter)
- Icons: simple line icons only (lucide-react) — no illustrative/decorative icon sets
- Components: white cards with subtle shadow on light-grey page backgrounds; navy header/sidebar; gold used only to mean "primary action / confirmed / important" — keep that meaning consistent everywhere
- Reference the Stitch-generated screens for exact layout of each page below — this spec defines scope and data, Stitch output defines pixel layout

## 4. Pages to Build (exactly these — no more)

1. **Login** — simple email/password via Supabase Auth. No public landing page needed for the working app (that was a separate marketing mockup) — go straight to a clean login screen in the navy/white/gold theme.
2. **Command Center Dashboard** — stat cards (Active Cases, Open Alerts, Entities Tracked), Recent Alerts list, Active Hotspots map (static Mumbai map image with plotted markers is fine — no live GIS needed), AI-Inferred Findings row.
3. **Case Search & Detail** — search/filter case list, click into a case detail view (brief facts, extracted MO tags, linked entities, similar cases by MO score).
4. **Entity Profile** — person profile with attributes, timeline of events, tabs for relationships/cases/evidence, connected-entities graph preview.
5. **Knowledge Graph Explorer** — full interactive graph view, filterable by entity/relationship type and confidence threshold.
6. **Alerts & Findings** — filterable alert list with severity, expandable detail, review/assign/dismiss actions (can just update a status field — no real workflow/notification system needed).
7. **MO Similarity View** — side-by-side MO fingerprint comparison and ranked similar-cases list.

Do not build: user management/admin panel, settings page, multi-role permissions, notifications system, report generation/export, mobile app, or any page not listed above. If it's not in this list, it's out of scope for this build.

## 5. Data Model (Supabase tables — minimal, only what the 7 pages actually use)

Keep this lean. Don't add extra columns "for completeness" — only what a screen actually displays or filters by.

```sql
-- Core entities
cases (id, crime_no, case_no, crime_category, crime_major_head, crime_minor_head,
       status, registered_date, incident_from, incident_to, latitude, longitude, brief_facts)

persons (id, canonical_name, aliases text[], dob, gender, status_tag, confidence_score)

phones (id, normalized_number_hash, owner_person_id, first_seen, last_seen)

vehicles (id, registration_hash, vehicle_type, owner_person_id)

accounts (id, account_hash, institution_type, owner_person_id)

organizations (id, name, type)

-- Roles & links
person_case_roles (id, person_id, case_id, role_type)  -- accused/victim/complainant/witness

relationships (id, source_type, source_id, target_type, target_id, relationship_type,
               confidence, status, -- 'observed' | 'inferred'
               first_seen, last_seen, source_evidence text)

-- Events (keep generic, don't build separate tables per event type)
events (id, event_type, case_id, person_id, location_text, latitude, longitude,
        event_time, description)

-- MO
mo_fingerprints (id, case_id, target, timing, entry_method, tools, transport,
                 concealment, action_sequence, victim_interaction, exit_method,
                 group_behavior, confidence)

mo_similarities (id, case_id_a, case_id_b, similarity_score, matching_components text[])

-- Alerts
alerts (id, alert_type, severity, title, description, target_type, target_id,
        confidence, evidence_refs text[], status, created_at)
```

No separate "provenance/audit log" tables, no versioned model-metadata tables, no vector embedding store for this build — those are real production concerns but add nothing visible to a demo. If similarity scores are needed, precompute and store them as plain rows (`mo_similarities`) rather than building real embedding search.

## 6. Feature Scope — Build vs Explicitly Skip

**Build:**
- Real CRUD-backed search/filter on cases and entities (actual Supabase queries, not client-side filtering of a hardcoded array)
- Real graph rendering from the `relationships` table
- Alert list with working status updates (New → Reviewed → Dismissed)
- MO similarity list sourced from the `mo_similarities` table

**Explicitly skip (do not build, even if it seems easy):**
- Real NLP/NER pipeline on free text — MO fields and extracted entities should be pre-seeded data, not live-extracted
- Real link-prediction/anomaly-detection ML models — alerts and findings should be pre-seeded with plausible content, not computed live
- Live GIS/mapping (Google Maps API integration) — a static map image with absolute-positioned markers is enough
- Authentication roles/permissions beyond a single investigator login
- File upload / document management
- Real-time updates or websockets

## 7. Seed / Demo Data Rules

This is the part to get right — a hackathon demo lives or dies on believable data.

- Seed **15–25 cases**, not hundreds. Enough to make search/filter/similarity meaningful, not so many it looks like random filler.
- Seed **20–30 persons**, with realistic Indian names, 2–3 with genuine multi-hop connections (so the knowledge graph actually shows something interesting when explored) — not every person needs to connect to every other person.
- Every alert and finding must reference a real seeded case/entity ID — no alert should point to data that doesn't exist elsewhere in the app.
- Confidence scores should vary realistically (mix of high 80–95%, medium 55–75%, and a couple of low-confidence 30–45% ones) — don't make everything 90%+, that reads as fake.
- MO similarity scores should mostly cluster in a believable 40–75% range with only 1–2 standout 85%+ matches — not everything should be a "perfect match."
- Write brief_facts and descriptions in plain, realistic case-report language — short, factual, no dramatic/movie-style wording.
- Do not invent real place names implying real ongoing cases — keep localities generic-plausible (e.g. "near Bandra station area") rather than tied to a real address.
- No Lorem Ipsum anywhere in the final build — every field, even seed data, should read like real (synthetic) content.

## 8. Build Order

1. Supabase schema + seed script (get data right first — the demo depends on it)
2. Login + app shell (navy sidebar, top bar, routing)
3. Dashboard (uses seeded cases/alerts counts)
4. Case Search & Detail
5. Entity Profile
6. Knowledge Graph Explorer
7. Alerts & Findings
8. MO Similarity View

Build and verify each page against real Supabase data before moving to the next — don't build all 7 pages against hardcoded mock data and wire up the database at the end.

## 9. Quality Bar

- Every number on screen must come from a real query, not a hardcoded stat
- No placeholder "Lorem ipsum," "TODO," or "Coming soon" left in the shipped build
- No console errors on any of the 7 pages
- Consistent navy/white/gold theme across all pages — no page should look like it belongs to a different app
- Loading and empty states handled for every list/table (don't let a slow query show a blank white flash)
