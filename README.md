<div align="center">
  <h1>🎟️ EventPass</h1>
  <p><strong>Premium Event Ticketing Platform</strong></p>
  <p>Next.js 15 · Supabase · TypeScript · Tailwind CSS</p>

  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#user-flow">User Flow</a> ·
  <a href="#admin-panel">Admin Panel</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#database">Database</a> ·
  <a href="#api">API</a>
</div>

---

## ✨ Features

### For Users
- **Browse & Discover** — Browse live events with search, view event details, artist info, venue layout, and ticket categories
- **Ticket Selection** — Choose from tiered categories (Bronze/Silver/Gold/Platinum) with real-time availability
- **Multi-step Checkout** — Delivery details → OTP verification → Apply coupon → Payment method → Order creation
- **Coupon Discounts** — Apply percentage or fixed discount coupons at checkout
- **Order Tracking** — View order history with status updates, ticket breakdown, and delivery details
- **Profile Management** — Edit personal details, manage delivery addresses
- **Email OTP Verification** — Secure verification via Resend email delivery
- **Admin-Mediated Approval** — Orders require admin approval before payment

### For Administrators
- **Dashboard** — Real-time revenue, orders, events, and user stats with animated counters
- **Event Management** — Full CRUD with image upload, venue layout, ticket categories, and featured/trending toggles
- **Order Management** — Real-time pending orders with accept/reject, notification sounds, and auto-reject timeout
- **Order History** — Filterable, searchable history with PDF/CSV report downloads
- **User Analysis** — Browse all users with expandable order history and PDF report generation
- **Earnings Analytics** — Revenue charts (line/bar/pie), event/category breakdowns, payment history
- **Coupon System** — Create/manage discount coupons with usage limits, expiry, and visibility controls
- **Settings** — Configure commissions, tax rates, currencies, notifications, branding, and more

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | Next.js 15.1.6 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 3.4, `tailwind-merge`, `clsx` |
| **UI Components** | Radix UI (Accordion, AlertDialog, Avatar, Dialog, DropdownMenu, Popover, RadioGroup, Select, Switch, Tabs, Toast, Tooltip) |
| **State Management** | Zustand 5.0 (persisted to localStorage) |
| **Database** | Supabase PostgreSQL (custom REST client) |
| **Authentication** | Supabase Auth (email/password) |
| **File Storage** | Supabase Storage (`events` bucket) |
| **Email** | Resend 6.12 (OTP delivery) |
| **Charts** | Recharts 2.14 (Line, Bar, Pie) |
| **PDF Generation** | jsPDF 2.5 + jspdf-autotable 3.8 |
| **Animations** | Framer Motion 11.15 |
| **Icons** | Lucide React 0.469 |
| **Forms** | React Hook Form 7.54 + Zod 3.24 |
| **Notifications** | React Hot Toast 2.4 |

---

## 👤 User Flow

### 1. Browse Events (`/events`)
- All live events displayed in a responsive grid
- Search by event name, artist, or venue

### 2. Event Detail (`/events/[id]`)
- Full hero image with gradient overlay
- Artist info, description, venue details, venue layout
- Ticket categories sorted by price with availability
- Countdown timer, booking card, favorite/share buttons

### 3. Select Tickets (`/events/[id]/select`)
- Visual stage + tier map showing category positions
- Select category and quantity (bounded by availability)
- Proceed to checkout

### 4. Delivery Details (`/checkout/details`)
- Address form (name, phone, email, address, city, district, pincode)
- **OTP Verification**:
  - Phone OTP: Simulated client-side (4-digit code)
  - Email OTP: Sent via Resend API (`POST /api/send-otp`)
- Order summary with subtotal, 18% tax, and total

### 5. Checkout & Payment Selection (`/checkout`)
- **Coupon System**:
  - Enter coupon code and validate via `POST /api/coupons/validate`
  - Browse available coupons via `GET /api/coupons/visible`
  - Discount displayed in real-time on order summary
- **Payment Method**: UPI (default), Credit/Debit Card, Net Banking, Wallet
- Tax calculated on **discounted amount**: `(subtotal - discount) × 18%`
- Order created with status `pending`, stored with pre-discount `total_amount` + `discount_amount`

### 6. Approval Wait (`/checkout/approval`)
- 2-minute countdown timer
- Polls order status every 5 seconds
- **If accepted** → Redirect to payment page
- **If rejected** → "Try Again" screen
- **If timeout (120s)** → Auto-rejected (`status = "auto_rejected"`)

### 7. Payment (`/checkout/payment`)
- Order must be `accepted` before payment
- Payment method form (card with auto-formatting, UPI, net banking dropdown)
- **2-second simulated processing** (no real payment gateway)
- Order status → `paid`
- Confetti animation + success toast → redirect home

### 8. Order History (`/orders`)
- View all past orders with event details, ticket breakdown, delivery address
- Color-coded status badges (pending, accepted, paid, rejected, etc.)

---

## 🛡️ Admin Panel

### Sidebar Navigation

| Route | Label | Description |
|---|---|---|
| `/admin` | Dashboard | Revenue, orders, events, user stats |
| `/admin/orders` | New Orders | Real-time pending orders (15s polling) |
| `/admin/history` | Order History | Search/filter + CSV/PDF download |
| `/admin/events` | Live Events | Full event CRUD + categories |
| `/admin/reviews` | User Reviews | View and delete reviews |
| `/admin/users` | User Analysis | User list + PDF report generation |
| `/admin/earnings` | Earnings | Revenue charts & analytics |
| `/admin/coupons` | Discount Coupons | Coupon CRUD + toggles |

### Dashboard (`/admin`)
- 4 animated stat cards: Total Revenue, Total Orders, Live Events, Total Users
- Today's mini-KPI row (revenue + orders)
- Recent Orders table (last 5)
- Quick action cards
- Framer Motion staggered entrance animations

### New Orders (`/admin/orders`)
- Real-time polling every 15 seconds
- Grid of pending order cards with event image, customer info, ticket breakdown
- **Accept** → PATCH order to `accepted`
- **Reject** → PATCH order to `rejected`
- Notification sound + toast on new orders
- Animated card enter/exit transitions

### Order History (`/admin/history`)
- Filter by status (All, Pending, Accepted, Paid, Completed, Rejected)
- Client-side search (order ID, event, customer name, email, phone)
- Expandable rows showing full delivery details, event info, ticket chips
- **Download Report**: PDF (landscape auto-table) or CSV (UTF-8 BOM)

### Event Management (`/admin/events`)
- 3-column grid with live toggle, edit/delete
- **Create/Edit Modal**:
  - Event details: title, description, artist, venue, date/time
  - Image upload (drag-and-drop to Supabase Storage)
  - Venue layout upload
  - Featured, Trending, Sold Out toggles
- **Dynamic Ticket Categories**: Add/remove tiers with name, price, seats, color (8 presets)

### User Analysis (`/admin/users`)
- All users with search by name/email/phone
- Expandable cards showing address info + past orders
- **PDF Report**:
  - Main users table (name, email, phone, role, location, orders, order IDs)
  - Per-user order sub-tables (order ID, event, date, amount, status)
  - Orders fetched at download time in batches

### Earnings (`/admin/earnings`)
- 4 stat cards with trends (Total Revenue, Avg Order, Paid Orders, Projected)
- **Revenue Over Time** line chart (7D/30D toggle)
- **Daily Sales Count** bar chart
- **Revenue by Event** horizontal bar chart
- **Category-wise Revenue** drill-down (click event → pie chart)
- **Revenue by Status** donut pie chart
- **Rejected/Refunded** tracking with loss ratio
- **Payment History** table (last 20 payments)

### Discount Coupons (`/admin/coupons`)
- Row-based layout: type icon, code + copy button, value/usage/min/expiry
- Active toggle (enable/disable)
- Visibility toggle (show/hide from users)
- Create/edit inline form
- Auto-expiry detection with visual indicator
- Usage tracking (`used_count` vs `usage_limit`)

### Settings (`/admin/settings`)
6 tabs: General, Payments (commission, tax, currency, exchange rates), Orders (auto-cancel, max tickets), Notifications (email, OTP toggles), Reviews (auto-publish, approval), Branding (logo, favicon, color)

---

## 🗄️ Database

### Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles extending Supabase Auth |
| `events` | Event listings with metadata |
| `event_categories` | Ticket tiers per event |
| `orders` | Purchase orders with delivery address |
| `order_items` | Line items per order |
| `coupons` | Discount coupons with usage tracking |
| `addresses` | Saved user delivery addresses |
| `reviews` | User testimonials and ratings |
| `notifications` | In-app notifications |
| `carts` | Shopping cart items |

### Key Schema Details

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','auto_rejected','paid','completed')),
  total_amount DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  discount_amount DECIMAL(10,2),
  delivery fields...,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage','fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Resend account (free tier for email OTP)

### Installation

```bash
# Clone the repository
git clone https://github.com/AayushShah2007/Event-Management-System.git
cd Event-Management-System

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email OTP)
RESEND_API_KEY=re_xxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup
Run the SQL files in `database/` folder in your Supabase SQL Editor:
1. `fix.sql` — Creates all tables
2. `add-coupons.sql` — Adds coupons table
3. `add-delivery-address-to-orders.sql` — Adds delivery columns (if missing)

### Run

```bash
npm run dev
# Open http://localhost:3000
```


## 📁 Project Structure

```
├── app/
│   ├── admin/          # Admin panel pages (8 pages)
│   ├── api/            # API routes (10 endpoints)
│   ├── checkout/       # Checkout flow (4 pages)
│   ├── events/         # Event browsing (3 pages)
│   ├── orders/         # User order history
│   ├── profile/        # User profile
│   └── page.tsx        # Landing page
├── components/
│   ├── admin/          # Admin sidebar & navbar
│   ├── checkout/       # Checkout steps indicator
│   ├── event/          # Event cards
│   ├── layout/         # Navbar, footer, auth modal, etc.
│   ├── shared/         # OTP, confetti, review modal, download report
│   └── ui/             # Reusable UI components (Radix-based)
├── database/           # SQL migration files
├── hooks/              # Custom React hooks
├── lib/                # Utilities (Supabase REST client, helpers)
├── store/              # Zustand state store
├── types/              # TypeScript type definitions
└── supabase/           # Schema SQL
```

---

## 🧪 Key Design Decisions

- **Order total_amount stores pre-discount subtotal**: Discount is stored separately in `discount_amount` for audit trail
- **Tax on discounted amount**: Tax (18% default) is calculated on the post-discount subtotal
- **Admin-mediated flow**: Orders require admin approval before payment — suitable for events with manual verification
- **OTP verification**: Email OTP via Resend, phone OTP simulated (can be replaced with SMS provider)
- **No real payment gateway**: Payment is simulated with a 2-second delay (ready to integrate Razorpay/Cashfree/Stripe)
- **Custom Supabase REST client**: Uses raw fetch instead of Supabase JS SDK for lightweight, timeout-controlled queries

