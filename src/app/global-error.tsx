"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f3ed",
          color: "#1a1918",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <div>
          <p style={{ letterSpacing: "0.3em", fontSize: 22 }}>NOIRÉ</p>
          <h1 style={{ fontWeight: 400, fontSize: 40, margin: "24px 0 12px" }}>We&rsquo;ll be right back.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: "#5f5850" }}>
            Something unexpected happened. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              background: "#1a1918",
              color: "#f7f3ed",
              border: 0,
              padding: "14px 28px",
              fontFamily: "system-ui, sans-serif",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
