import { NextResponse } from "next/server";

// Serves the VAPID *public* key to the browser at runtime. We do this instead
// of relying on NEXT_PUBLIC_VAPID_PUBLIC_KEY because that variable is inlined at
// build time — and some hosts (e.g. Railway) only expose env vars at runtime,
// so the build-time value ends up empty. The public key is safe to expose.
export const dynamic = "force-dynamic";

export async function GET() {
  const key =
    process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
  return NextResponse.json({ key });
}
