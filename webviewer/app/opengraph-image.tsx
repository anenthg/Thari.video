import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "OpenLoom — Open Source Video Messaging";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Jamakkalam stripe colors and widths (symmetric pattern)
const STRIPES = [
  { color: "#F5F5E8", w: 5 },
  { color: "#1A1A2E", w: 3 },
  { color: "#0E9A57", w: 20 },
  { color: "#1A1A2E", w: 3 },
  { color: "#F5C518", w: 7 },
  { color: "#1A1A2E", w: 3 },
  { color: "#D92B2B", w: 19 },
  { color: "#1A1A2E", w: 3 },
  { color: "#0A0A12", w: 5 },
  { color: "#1A1A2E", w: 3 },
  { color: "#F5C518", w: 7 },
  { color: "#1A1A2E", w: 132 },
  { color: "#F5C518", w: 7 },
  { color: "#1A1A2E", w: 3 },
  { color: "#0A0A12", w: 5 },
  { color: "#1A1A2E", w: 3 },
  { color: "#D92B2B", w: 19 },
  { color: "#1A1A2E", w: 3 },
  { color: "#F5C518", w: 7 },
  { color: "#1A1A2E", w: 3 },
  { color: "#0E9A57", w: 20 },
  { color: "#1A1A2E", w: 3 },
  { color: "#F5F5E8", w: 5 },
  { color: "#1A1A2E", w: 2 },
];

const PATTERN_WIDTH = STRIPES.reduce((s, b) => s + b.w, 0);

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1A1A2E",
          position: "relative",
        }}
      >
        {/* Stripe band at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 180,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: Math.ceil(1200 / PATTERN_WIDTH) + 1 }).flatMap(
            (_, rep) =>
              STRIPES.map((s, i) => (
                <div
                  key={`${rep}-${i}`}
                  style={{
                    width: s.w,
                    height: 180,
                    backgroundColor: s.color,
                    flexShrink: 0,
                  }}
                />
              ))
          )}
        </div>

        {/* Gradient fade over stripes */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 180,
            background:
              "linear-gradient(to bottom, transparent 0%, transparent 40%, #1A1A2E 100%)",
          }}
        />

        {/* Terminal window mockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(26,26,46,0.92)",
            border: "1px solid rgba(245,245,232,0.1)",
            borderRadius: 24,
            padding: "48px 64px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Traffic light dots */}
          <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#D92B2B",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#F5C518",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: "#0E9A57",
              }}
            />
          </div>

          {/* Brand name */}
          <div style={{ display: "flex", fontFamily: "monospace", fontSize: 72, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#F5F5E8" }}>Open</span>
            <span style={{ color: "rgba(245,245,232,0.4)" }}>Loom</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              color: "rgba(245,245,232,0.5)",
              fontSize: 28,
              marginTop: 16,
              fontFamily: "sans-serif",
            }}
          >
            Open-source Loom alternative you self-host
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            color: "rgba(245,245,232,0.3)",
            fontSize: 20,
            fontFamily: "monospace",
          }}
        >
          openloom.live
        </div>
      </div>
    ),
    { ...size }
  );
}
