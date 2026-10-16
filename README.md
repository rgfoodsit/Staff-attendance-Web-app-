# StaffTrack (V1)

A role-based attendance management and workforce intelligence system built strictly adhering to the Product Requirements Document (PRD).

## 🚀 Key Features

### 1. Employee Mobile Web (`/`)
- **Live Selfie Capture:** Device camera streaming with front-facing camera lock via HTML5 Canvas & MediaDevices API. No file/gallery uploads permitted (PRD #14).
- **GPS Coordinates & Readable Address:** High-accuracy geolocation capture with reverse geocoded address and Google Maps preview link (PRD #15).
- **Explicit Confirmation Review:** Pre-submission modal showing captured selfie, address, and timestamp before committing (PRD #18).
- **Single Daily Action Enforcement:** One Check-in and one Check-out per calendar day with duplicate action prevention (PRD #13, #22).
- **Automated Late Calculation:** Evaluated automatically against HR-configured `official_checkin_time` + `late_threshold_minutes` (PRD #19, #34).
- **Current-Day Leave Marking:** Full-Day (blocks attendance) and Half-Day (1st/2nd half, allows attendance for working portion) with mandatory reason and comment (PRD #25-27).
- **Daily Work Report:** Optional free-text report, editable during the current day, locked to read-only at end of day (PRD #44, #45).
- **Attendance Correction Requests:** Submit corrections for check-in/out times, statuses, and forgotten check-outs (PRD #35, #37).

### 2. Management Desktop Web (`/`)
- **Top KPI Cards:** Total Employees, Present Today, Absent Today, Late Today, On Leave, and Pending Corrections (PRD #54).
- **Attendance Evidence Inspector:** Separate inspection of check-in and check-out selfie pictures, GPS lat/long, readable location, and map links (PRD #42).
- **Correction Approval Center:**
  - Standard Corrections: Approved/Rejected exclusively by HR (PRD #36).
  - Forgotten Check-out Corrections: Approved/Rejected by Manager or HR (PRD #37).
- **Direct HR Adjustments:** HR can adjust status, check-in, or check-out times with mandatory audit reason while preserving original captured evidence (PRD #30, #31, #32).
- **Admin Master Data:** Create, edit, and deactivate Departments and Designations (PRD #7).
- **Reporting & Exports:** Filter by Department, Employee, Status, and Date Range. Export clean tabular data to Excel (`.xlsx`) and PDF (`.pdf`) omitting selfie/GPS evidence (PRD #63, #65).
- **System Audit Trail:** Complete audit trail tracking corrections, HR adjustments, credential resets, and rule updates (PRD #39).

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Design System:** Custom tokens, sleek glassmorphism, responsive mobile phone preview frame
- **Backend & Database:** Next.js Server Functions + Supabase (PostgreSQL, Row-Level Security, Storage, Edge Functions)
- **Validation:** Zod schemas
- **Hardware Integration:** Browser `navigator.mediaDevices` (Camera) & `navigator.geolocation` (GPS)
- **Document Generation:** `xlsx` (Excel) & `jspdf` + `jspdf-autotable` (PDF)

---

## 👥 Role-Based Access Control
 
Authentication is strictly enforced via Employee ID and password against Supabase:
 
| Role | Portal Experience | Capabilities |
|---|---|---|
| **Employee** | Dedicated Full-Screen Mobile Web (`/`) | Live camera selfie verification, high-accuracy GPS capture, one check-in / check-out daily, leave marking, work reports, correction requests |
| **HR** | Management Desktop Web (`/`) | Real-time workforce KPIs, attendance evidence inspection (selfies + GPS map), timing rules configuration, correction approval, direct adjustments, Excel/PDF exports |
| **Admin** | Management Desktop Web (`/`) | Employee profile provisioning, department & designation master data management, full audit trail access |

---

## 🏃 Running the Application

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```
