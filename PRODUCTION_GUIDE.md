# Recess Camp Planner — Production Guide

How to take this prototype from mock data to a fully functional camp planning tool connected to real infrastructure.

---

## Current state

- **Frontend**: React 19 + Vite, deployed on Vercel
- **Data**: 8 hardcoded mock camps in `src/data/camps.js`
- **Auth**: None
- **Database**: None
- **Payments**: None
- **State**: All in-memory React state (lost on refresh)

---

## Architecture overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel     │     │   Supabase   │     │     Medusa      │
│  (Frontend)  │────▶│  (Database)  │     │  (Commerce /    │
│  Next.js or  │     │  + Auth      │     │   Catalog)      │
│  Vite+React  │     └──────────────┘     └─────────────────┘
│              │            │                      │
│              │     ┌──────────────┐     ┌─────────────────┐
│              │────▶│   Clerk      │     │    Klaviyo       │
│              │     │  (Auth)      │     │  (Email flows)  │
└─────────────┘     └──────────────┘     └─────────────────┘
```

You have two paths depending on timeline:

- **Path A (fast, standalone)**: Supabase for database + auth. Get live data in a day.
- **Path B (integrated)**: Connect to Medusa product catalog + Clerk auth. Matches the existing Recess stack.

This guide covers both. Start with Path A to validate, migrate to Path B when ready.

---

## Phase 1: Persist state (2 hours)

Before any backend work, stop losing state on page refresh.

### 1a. localStorage persistence

In `App.jsx`, replace the `useState` calls with a hook that syncs to localStorage:

```js
function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

// Usage:
const [cartIds, setCartIds] = usePersistedState("recess-cart", []);
const [planIds, setPlanIds] = usePersistedState("recess-compare", []);
const [filters, setFilters] = usePersistedState("recess-filters", DEFAULT_FILTERS);
const [onboarded, setOnboarded] = usePersistedState("recess-onboarded", false);
```

This gives you persistence across page refreshes with zero backend.

---

## Phase 2: Real camp data — Supabase (Path A)

### 2a. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project
2. Get your project URL and anon key from Settings → API

### 2b. Create the camps table

Run this in the Supabase SQL editor:

```sql
create table camps (
  id serial primary key,
  name text not null,
  program text not null,
  category text not null,
  provider text not null,
  price integer not null,
  age_min integer not null,
  age_max integer not null,
  spots_remaining integer not null,
  total_spots integer not null,
  location text,
  distance numeric,
  hours text,
  day_type text,
  weeks text[] not null default '{}',
  highlights text[] default '{}',
  description text,
  rating numeric default 0,
  reviews integer default 0,
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Enable row-level security
alter table camps enable row level security;

-- Allow public read
create policy "Camps are publicly readable"
  on camps for select using (true);
```

### 2c. Seed with your mock data

```sql
insert into camps (name, program, category, provider, price, age_min, age_max,
  spots_remaining, total_spots, location, distance, hours, day_type, weeks,
  highlights, description, rating, reviews, image_url)
values
  ('Dougherty Arts Center', 'Painting & Mixed Media', 'Creative Arts',
   'City of Austin Parks', 275, 6, 12, 8, 20, 'Downtown Austin', 2.1,
   '9 AM – 4 PM', 'Full Day', '{w1,w2,w3,w5,w7}',
   '{New camper friendly,Trial available}',
   'Explore painting, sculpture, and mixed media with professional artists.',
   4.8, 124, 'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=800&h=500&fit=crop'),
  -- ... repeat for all 8 camps (copy values from src/data/camps.js)
;
```

### 2d. Install the Supabase client

```bash
npm install @supabase/supabase-js
```

### 2e. Create an API layer

Create `src/api/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function fetchCamps(filters = {}) {
  let query = supabase
    .from('camps')
    .select('*')
    .eq('active', true)
    .order('rating', { ascending: false })

  if (filters.categories?.length > 0) {
    query = query.in('category', filters.categories)
  }
  if (filters.budget) {
    query = query.lte('price', filters.budget)
  }
  if (filters.childAge) {
    query = query.lte('age_min', filters.childAge).gte('age_max', filters.childAge)
  }

  const { data, error } = await query
  if (error) throw error
  return data.map(row => ({
    ...row,
    ageMin: row.age_min,
    ageMax: row.age_max,
    spotsRemaining: row.spots_remaining,
    totalSpots: row.total_spots,
    type: row.day_type,
    image: row.image_url,
  }))
}
```

### 2f. Replace mock data in App.jsx

```js
import { fetchCamps } from './api/supabase'

// In App component:
const [camps, setCamps] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchCamps().then(data => {
    setCamps(data);
    setLoading(false);
  });
}, []);

// Use `camps` instead of MOCK_CAMPS everywhere
```

### 2g. Environment variables

Create `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add to Vercel: Settings → Environment Variables.

---

## Phase 3: Authentication — Clerk

### 3a. Set up Clerk

1. Go to [clerk.com](https://clerk.com), create an application
2. Get your publishable key

```bash
npm install @clerk/clerk-react
```

### 3b. Wrap the app

In `src/main.jsx`:

```jsx
import { ClerkProvider } from '@clerk/clerk-react'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

ReactDOM.createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={CLERK_KEY}>
    <App />
  </ClerkProvider>
)
```

### 3c. Add sign-in triggers

Gate these actions behind auth:
- Saving a plan
- Proceeding to booking
- Sharing a plan

```jsx
import { useUser, SignInButton } from '@clerk/clerk-react'

// In your component:
const { isSignedIn, user } = useUser();

// When user clicks "Proceed to booking":
if (!isSignedIn) {
  return <SignInButton mode="modal"><button>Sign in to book</button></SignInButton>
}
```

### 3d. Save plans per user

Add a `saved_plans` table in Supabase:

```sql
create table saved_plans (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,  -- Clerk user ID
  child_name text,
  child_age integer,
  filters jsonb,
  cart_ids integer[],
  compare_ids integer[],
  calendar_assignments jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table saved_plans enable row level security;

create policy "Users can read own plans"
  on saved_plans for select using (auth.uid()::text = user_id);

create policy "Users can insert own plans"
  on saved_plans for insert with check (auth.uid()::text = user_id);

create policy "Users can update own plans"
  on saved_plans for update using (auth.uid()::text = user_id);
```

---

## Phase 4: Real commerce — Medusa (Path B)

If Recess already runs Medusa, this replaces the Supabase camps table.

### 4a. Map camps to Medusa products

Each camp = a Medusa **product**. Each week = a Medusa **variant**.

```
Product: "Dougherty Arts Center — Painting & Mixed Media"
├── Variant: "Week 1 (Jun 9–13)" — $275, inventory: 8
├── Variant: "Week 2 (Jun 16–20)" — $275, inventory: 8
├── Variant: "Week 3 (Jun 23–27)" — $275, inventory: 8
└── ...
```

Product metadata stores: `age_min`, `age_max`, `hours`, `day_type`, `category`, `highlights`, `location`, `distance`.

### 4b. Install Medusa client

```bash
npm install @medusajs/medusa-js
```

### 4c. Fetch camps from Medusa

```js
import Medusa from '@medusajs/medusa-js'

const medusa = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_URL,
  maxRetries: 3
})

export async function fetchCampsFromMedusa() {
  const { products } = await medusa.products.list({
    category_id: ['camp-category-id'],
    expand: 'variants,variants.inventory_items'
  })

  return products.map(p => ({
    id: p.id,
    name: p.title,
    program: p.subtitle,
    category: p.metadata.category,
    provider: p.metadata.provider,
    price: p.variants[0]?.prices[0]?.amount / 100, // Medusa stores cents
    ageMin: p.metadata.age_min,
    ageMax: p.metadata.age_max,
    spotsRemaining: p.variants.reduce((min, v) =>
      Math.min(min, v.inventory_quantity), Infinity),
    totalSpots: p.metadata.total_spots,
    location: p.metadata.location,
    distance: p.metadata.distance,
    hours: p.metadata.hours,
    type: p.metadata.day_type,
    weeks: p.variants.map(v => v.metadata.week_id),
    highlights: p.metadata.highlights || [],
    description: p.description,
    rating: p.metadata.rating,
    reviews: p.metadata.reviews,
    image: p.thumbnail,
  }))
}
```

### 4d. Create a real cart

When the user clicks "Proceed to booking":

```js
async function createMedusaCart(cartCampIds, selectedWeeks) {
  // Create cart
  const { cart } = await medusa.carts.create()

  // Add line items — one per camp per week
  for (const campId of cartCampIds) {
    const product = await medusa.products.retrieve(campId)
    for (const weekId of selectedWeeks) {
      const variant = product.variants.find(v => v.metadata.week_id === weekId)
      if (variant) {
        await medusa.carts.lineItems.create(cart.id, {
          variant_id: variant.id,
          quantity: 1,
        })
      }
    }
  }

  // Redirect to checkout
  window.location.href = `${MEDUSA_STOREFRONT_URL}/checkout?cart_id=${cart.id}`
}
```

---

## Phase 5: Real-time availability

### Option A: Supabase Realtime

```js
// Subscribe to inventory changes
supabase
  .channel('camp-availability')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'camps',
    filter: 'active=eq.true'
  }, (payload) => {
    setCamps(prev => prev.map(c =>
      c.id === payload.new.id
        ? { ...c, spotsRemaining: payload.new.spots_remaining }
        : c
    ))
  })
  .subscribe()
```

### Option B: Medusa inventory events

Medusa publishes inventory events. Listen via webhooks or poll:

```js
// Poll every 30 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const fresh = await fetchCampsFromMedusa()
    setCamps(fresh)
  }, 30000)
  return () => clearInterval(interval)
}, [])
```

---

## Phase 6: Email flows — Klaviyo

### 6a. Track key events

Install Klaviyo's JS snippet in `index.html`, then fire events:

```js
// When user completes onboarding
window._learnq?.push(['track', 'Started Camp Planning', {
  child_name: filters.childName,
  child_age: filters.childAge,
  interests: filters.categories,
  weeks_needed: filters.weeks.length,
}]);

// When user saves a plan
window._learnq?.push(['track', 'Saved Camp Plan', {
  camps: summaryCamps.map(c => c.name),
  total_weekly: summaryTotal,
  total_estimated: summaryTotal * filters.weeks.length,
}]);

// When user starts checkout
window._learnq?.push(['track', 'Started Checkout', {
  cart_value: summaryTotal * filters.weeks.length,
  camp_count: cartIds.length,
}]);
```

### 6b. Suggested Klaviyo flows

1. **Abandoned plan** — User completed onboarding but hasn't booked after 24h
2. **Plan saved reminder** — "You saved 3 camps for Emma — ready to book?"
3. **Availability alert** — "Only 3 spots left at Dougherty Arts Center"
4. **Booking confirmation** — Post-purchase with calendar details
5. **Co-parent share** — "Eric shared a camp plan with you"

---

## Phase 7: Migrate into the Recess Next.js app

When you're ready to make this a real route on recess.com:

### 7a. Move files

```
recess-webapp/
  src/
    app/
      (public)/
        camp-planner/
          page.tsx          ← App.jsx (converted to server component wrapper)
          layout.tsx        ← Uses the shared Recess layout
    features/
      camp-planner/
        components/
          Onboarding.tsx    ← Onboarding.jsx (add TypeScript)
          ComparisonGrid.tsx
          ComparePage.tsx
          FilterPanel.tsx
          Header.tsx        ← May use shared Recess header instead
        api/
          camps.ts          ← Supabase or Medusa fetch logic
        hooks/
          usePersistedPlan.ts
        types.ts            ← Camp, Filter, CalendarAssignment types
```

### 7b. Convert to TypeScript

Define your types:

```ts
interface Camp {
  id: number;
  name: string;
  program: string;
  category: string;
  provider: string;
  price: number;
  ageMin: number;
  ageMax: number;
  spotsRemaining: number;
  totalSpots: number;
  location: string;
  distance: number;
  hours: string;
  type: string;
  weeks: string[];
  highlights: string[];
  description: string;
  rating: number;
  reviews: number;
  image: string;
}

interface Filters {
  childName: string;
  childAge: number;
  budget: number;
  weeks: string[];
  categories: string[];
  dayType: 'any' | 'full' | 'half';
}

interface ScoredCamp extends Camp {
  score: number;
  reasons: string[];
}
```

### 7c. Use Tailwind instead of custom CSS

The Recess webapp uses Tailwind v4. Convert the CSS to utility classes and lean on the shared design system tokens already defined in the webapp's `globals.css`.

### 7d. Server components for data fetching

```tsx
// app/(public)/camp-planner/page.tsx
import { fetchCamps } from '@/features/camp-planner/api/camps'
import CampPlannerClient from '@/features/camp-planner/components/CampPlannerClient'

export default async function CampPlannerPage() {
  const camps = await fetchCamps()
  return <CampPlannerClient initialCamps={camps} />
}
```

---

## Checklist: MVP to production

| Step | Effort | Impact |
|------|--------|--------|
| localStorage persistence | 30 min | State survives refresh |
| Supabase camps table + API | 2–3 hr | Real data, admin can add camps |
| Clerk auth | 1–2 hr | User accounts, saved plans |
| Save/load plans to Supabase | 2 hr | Plans persist across devices |
| Medusa catalog integration | 4–6 hr | Live pricing + inventory from Recess catalog |
| Medusa cart + checkout | 3–4 hr | Real booking flow |
| Klaviyo event tracking | 1–2 hr | Email follow-up sequences |
| Next.js migration | 1–2 days | Lives at recess.com/camp-planner |
| TypeScript conversion | 4–6 hr | Type safety |
| Tailwind migration | 4–6 hr | Consistent with Recess design system |

**Recommended order**: localStorage → Supabase → Clerk → Medusa → Klaviyo → Next.js migration

---

## Environment variables needed

```env
# Supabase (Path A)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...

# Medusa (Path B)
VITE_MEDUSA_URL=https://api.recess.com
VITE_MEDUSA_API_KEY=sk_...

# Klaviyo
VITE_KLAVIYO_COMPANY_ID=ABC123
```

Add all of these in Vercel → Project Settings → Environment Variables.
