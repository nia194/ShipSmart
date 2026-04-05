// TODO: [MIGRATION] Replace this placeholder with the Lovable App.tsx after migration.
// The Lovable App.tsx includes:
//   - QueryClientProvider (@tanstack/react-query)
//   - TooltipProvider (@radix-ui)
//   - Toaster / Sonner
//   - BrowserRouter + Routes (react-router-dom)
//   - AuthContext provider
//   - All page routes: /, /auth, /saved, /not-found

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// TODO: [MIGRATION] Replace these placeholder pages with migrated pages from Lovable
function PlaceholderPage({ name }: { name: string }) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>ShipSmart — {name}</h1>
      <p>
        Migration in progress. Copy pages from the Lovable project into{" "}
        <code>apps/web/src/pages/</code> and update imports here.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* TODO: [MIGRATION] Replace with migrated page components */}
          <Route path="/" element={<PlaceholderPage name="Home" />} />
          <Route path="/auth" element={<PlaceholderPage name="Auth" />} />
          <Route path="/saved" element={<PlaceholderPage name="Saved Options" />} />
          <Route path="*" element={<PlaceholderPage name="Not Found" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
