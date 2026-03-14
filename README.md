🚀 Next-Gen Kanban | Premium Trello Clone

A modern, highly performant, and visually stunning project management tool inspired by the aesthetics of Linear, Notion, and premium SaaS applications. Built exclusively with Next.js (App Router), React, and Tailwind CSS.

✨ Features

📋 Three Distinct Views

Kanban Board: Drag-and-drop lists and cards with seamless animations. Features custom list colors with ambient, glowing gradients.

Inbox (Task Triaging): A smart, unified glass-panel view grouping tasks by urgency: Overdue (Red), Due Today (Amber), and Upcoming.

Planner (Calendar): A 7-day horizontal view. Features a CSS Grid layout on desktop and a smooth, native-feeling horizontal snap-swipe interface on mobile.


🃏 Powerful Card System

Rich Details: Full descriptions, cover images (URL or solid colors), and dynamic due dates.

Granular Control: Add labels (with custom colors), assign members, and track progress via checklists with visual progress bars.

Premium Modal: A meticulously designed, fully opaque dark-theme modal (zinc-950) that prevents background bleed while maintaining a crisp, professional UI.


🎨 Ultimate Customization

Board Backgrounds: Choose from preset premium gradients or upload custom images (Base64 encoding, <2MB limit).

Global Search & Filter: Spotlight-style search bar and an advanced dark-glass filter menu (filter by labels, members, or due dates).

🛠️ Tech Stack

Framework: Next.js 14/15 (App Router)

Frontend: React 18

Styling: Tailwind CSS

UI Components: Shadcn UI (Radix Primitives)

Icons: Lucide React

Drag & Drop: @dnd-kit/sortable

Date Formatting: date-fns

State Management: React Context API (useReducer pattern)

🏗️ Architecture & Technical Decisions

Why Next.js Server Actions over Express.js?

For this project, I actively chose to forgo a traditional decoupled Express.js backend in favor of Next.js Server Actions. Here is the rationale:

Zero API Boilerplate: Instead of writing Express routers, controllers, and frontend fetch wrappers, I can invoke server-side logic directly as standard async JavaScript functions (e.g., await updateCardCover(cardId, url)).


End-to-End Type Safety: By residing in the same repository, the frontend and backend implicitly share TypeScript interfaces (Card, List, Board). Changes to the database schema immediately flag TypeScript errors in the UI components.


Optimistic UI Integration: Server Actions pair perfectly with React Context. I dispatch an update to the local state instantly (Optimistic UI) and call the Server Action in the background to persist the data, resulting in a zero-latency feel for the user.


Simplified Deployment: Managing a single Monorepo (Next.js) on Vercel is vastly superior to provisioning separate hosting for a Node/Express server and dealing with CORS, varying cold starts, and separate CI/CD pipelines.


Technical Details & Implementation

Optimistic Updates: The app utilizes an aggressive optimistic UI strategy. Whenever a user moves a card, adds a label, or applies a gradient, the Context API updates the DOM instantly, while the Server Action syncs to the database asynchronously.

Bulletproof Layouts: Modals and responsive views use strict CSS Grids (grid-cols-[1fr_220px]) rather than absolute positioning or complex flex layouts. This prevents UI overlapping regardless of the device screen size.

Mobile-First Engineering: Heavy tables and 7-day views were re-engineered using snap-x snap-mandatory and horizontal scroll masking to provide a native mobile app swipe experience.

🧠 Assumptions

While building this application, the following technical assumptions were made:

Authentication: The app assumes a user session exists (state.currentUser). In a full production environment, this would be wired up to a provider like Clerk, NextAuth, or Supabase Auth.

Image Handling: Board backgrounds are currently assumed to be stored as Base64 strings (limited to 2MB) or external URLs to bypass the need for an AWS S3/Cloudinary bucket setup in the MVP phase.

Database Consistency: The app trusts the Server Actions to complete successfully. In an edge-case network failure, the optimistic UI would require a fallback mechanism to revert the Context state to match the database truth.
