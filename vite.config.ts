import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pinned (review fix) — Vite's own default behavior, with no `server.port`
  // set, is to try 5173 and silently auto-increment to 5174/5175/... if
  // that's taken. That's fine for casual local browsing, but it breaks
  // magic-link sign-in testing on a phone: Supabase's Redirect URLs
  // allow-list has to name the LAN URL (`http://<LAN-IP>:<port>`) the
  // dev server is actually reachable at, and a silently-drifted port
  // invalidates that entry without anyone noticing until a link fails.
  // `strictPort: true` makes Vite refuse to start on any OTHER port
  // instead of drifting — if 5173 is genuinely unavailable, `npm run dev`
  // now fails loudly (with a clear error) rather than quietly moving the
  // server somewhere the allow-listed URL no longer reaches. Doesn't
  // touch `--host` (still supplied via package.json's own `dev` script)
  // — this only fixes which port that host binds to.
  server: {
    port: 5174,
    strictPort: true,
  },
})
