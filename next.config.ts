import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node built-ins are only ever used from server code. The `server-only`
  // import at the top of src/lib/db.ts (and the other server modules) makes
  // any accidental import from a Client Component a clear build error, which
  // is more reliable than aliasing the builtins away.
};

export default nextConfig;