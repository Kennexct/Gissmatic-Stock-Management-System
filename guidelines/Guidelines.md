# Gissmatic Stock Management System v4 - Master AI Context

> **AI INSTRUCTION:** When modifying, debugging, or extending this project, you MUST read and adhere to the following architectural, design, and structural rules. 

## 1. Tech Stack
* **Frontend Framework:** React 18, Vite
* **Styling:** Tailwind CSS v4, custom CSS variables (`theme.css`)
* **UI Components:** Radix UI primitives, custom `src/app/components/ui` components (shadcn/ui style)
* **Icons:** `lucide-react`
* **Animations:** `motion` (Framer Motion v12) for premium micro-animations
* **Charts:** `recharts` for dashboard analytics
* **Database & Auth:** Supabase (`@supabase/supabase-js`)

## 2. Core Architecture & Data Flow
* **Cloud-First:** This application is strictly cloud-based. **DO NOT** use or implement `localStorage` fallbacks for massive datasets (like the full product catalog), as it crashes the browser quota. 
* **State Management:** Global state (user, permissions, inventory cache) is managed within `src/app/components/auth-context.tsx`.
* **Database (Supabase):** 
  * The primary tables are: `products`, `customers`, `suppliers`, `audit_logs`, `outgoing_sales`, `frozen_stocks`, `categories`, `users`, and `user_permissions`.
  * **Row Level Security (RLS)** is strictly enforced. The application expects that any database `SELECT`, `UPDATE`, `INSERT`, or `DELETE` requires an active authenticated session.
  * We use a dedicated `supabaseAdmin` client in `lib/supabase.ts` *only* for creating staff accounts without logging the current superadmin out.

## 3. UI/UX Design System
* **Premium Aesthetic:** The brand relies on a sleek, modern, and industrial aesthetic. 
* **Primary Colors:** Deep Navy Blue (`#0a1565`), Vibrant Green (`#16c60c`), and clean slate/gray backgrounds (`#f0f5ff` for app backgrounds).
* **Animations:** Always use `motion.div` from `motion/react` for complex layouts. Dashboard cards should stagger in (`staggerChildren: 0.1`). Modals and drawers should slide or scale smoothly into view.
* **Mobile Responsiveness:** Inventory and data tables must be wrapped in `overflow-x-auto` to prevent breaking mobile layouts, or completely transformed into mobile card views. Do not use absolute widths that break on small screens.

## 4. Development Rules
* **No Hardcoded Secrets:** Never put Supabase keys directly into code. Always use `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
* **Icons & UI:** Always prefer `lucide-react` icons. Group buttons logically (e.g., use `<DropdownMenu>` for grouped export options like PDF/Excel instead of multiple isolated buttons).
* **Error Handling:** The root `<ErrorBoundary>` in `App.tsx` catches fatal crashes. If you implement a potentially fragile query, wrap it in a try/catch and use the `toast` function from `sonner` to alert the user.

## 5. E-Commerce Integration (Future Context)
If building storefront or customer-facing e-commerce portals:
* They should connect to this exact same Supabase backend.
* Purchases must deduct from the `products` table (`quantity > 0`) and insert logs into `outgoing_sales`.
