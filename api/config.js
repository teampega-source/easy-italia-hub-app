// ─────────────────────────────────────────────────────────────
// Easy Italia Hub — public runtime config endpoint.
//
// Vercel serverless function. Tells the static site whether a Supabase
// backend has been wired up yet, and (if so) hands the browser the PUBLIC
// connection details so the client can talk to Supabase directly.
//
// HOW ACTIVATION WORKS: the site ships in "demo mode" (all data in the
// browser's localStorage / IndexedDB). The moment SUPABASE_URL and
// SUPABASE_ANON_KEY are set in the Vercel project env, this endpoint starts
// reporting `configured:true` and the client (eih-auth.js) upgrades itself to
// the real backend automatically — no code change, no redeploy of the pages.
//
// SECURITY — what is and isn't exposed here:
//   • SUPABASE_URL + SUPABASE_ANON_KEY are PUBLIC by design. The anon key is
//     meant to live in the browser; it is protected by Supabase Row Level
//     Security (RLS), which scopes every row to its owner. Exposing it is fine.
//   • SUPABASE_SERVICE_ROLE_KEY (or any other secret) is NEVER read or returned
//     here. It must only ever be used server-side. Do not add it to this file.
//
// Zero npm dependencies: just reads process.env and returns JSON.
// ─────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Read-only endpoint: accept GET (and HEAD, which Vercel derives from GET).
  // Anything else is rejected so this can never be used to mutate state.
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Edge/CDN cache: this changes only when env vars change (i.e. a redeploy),
  // so a short shared cache is safe and avoids a function call on every page.
  res.setHeader("Cache-Control", "public, s-maxage=60");

  // "configured" is true only when BOTH the URL and the anon (public) key exist.
  const url = process.env.SUPABASE_URL || null;
  const anonKey = process.env.SUPABASE_ANON_KEY || null;

  return res.status(200).json({
    configured: Boolean(url && anonKey),
    url,
    anonKey,
  });
};
