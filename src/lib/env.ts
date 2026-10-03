import "server-only";

function required(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. See .env.example and the README.`);
  }
  return value;
}

export const publicEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
};

export const serverEnv = {
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  /** Paystack secret key (sk_test_… or sk_live_…); null when online payment is not configured. */
  paystackSecretKey: () => process.env.PAYSTACK_SECRET_KEY || null,
  /** Returns null unless both are set; the site then uses Supabase's redirect flow for Google. */
  googleOAuth: () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  },
  /** Returns null when Mailgun is not configured, so email can be skipped without failing orders. */
  mailgun: () => {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const from = process.env.MAILGUN_FROM_EMAIL;
    if (!apiKey || !domain || !from) return null;
    return {
      apiKey,
      domain,
      from,
      baseUrl: (process.env.MAILGUN_API_BASE_URL || "https://api.mailgun.net").replace(/\/$/, ""),
    };
  },
};
