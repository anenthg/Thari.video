import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — OpenLoom",
  description:
    "OpenLoom privacy policy. Learn how your data is handled when using the OpenLoom screen recorder.",
};

export default function PrivacyPage() {
  return (
    <main className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative flex min-h-[35dvh] flex-col items-center justify-center px-6">
        <div className="jamakkalam-stripes jamakkalam-stripes-animated pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(26,26,46,0.7) 100%)",
          }}
        />

        <div className="glass-terminal relative z-10 w-full max-w-3xl rounded-2xl p-8 md:p-12">
          <div className="mb-6 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[var(--crimson)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--mustard)]" />
            <span className="h-3 w-3 rounded-full bg-[var(--emerald)]" />
            <span className="ml-3 font-mono text-xs text-[var(--cotton)]/40">
              ~/openloom/privacy
            </span>
          </div>

          <h1 className="font-sans text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-[var(--cotton)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-[var(--cotton)]/60">
            Last updated: March 7, 2025
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-12 text-[var(--cotton)]/80 leading-relaxed">
          {/* Overview */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Overview
            </h2>
            <p>
              OpenLoom is an open-source screen recorder available as a Chrome
              extension and desktop application. It is designed with a
              privacy-first approach: <strong>your recordings are stored on your
              own infrastructure</strong>, not on OpenLoom servers. We do not
              operate any centralized servers that collect, store, or process
              your video recordings or personal data.
            </p>
          </div>

          {/* Data Collection */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Data We Collect
            </h2>
            <p className="mb-4">
              <strong>OpenLoom does not collect any personal data.</strong> The
              extension and desktop app run entirely on your device. Specifically:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>No analytics or telemetry</strong> — we do not track
                usage, page views, or feature engagement.
              </li>
              <li>
                <strong>No account system</strong> — OpenLoom does not require
                you to create an account or sign in to any OpenLoom service.
              </li>
              <li>
                <strong>No advertising</strong> — there are no ads, trackers, or
                third-party marketing scripts.
              </li>
              <li>
                <strong>No crash reporting</strong> — errors stay on your device.
              </li>
            </ul>
          </div>

          {/* Video Recordings */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Video Recordings
            </h2>
            <p className="mb-4">
              When you record your screen with OpenLoom, the recording is
              processed locally on your device. When you choose to upload a
              recording, it is sent directly from your browser or app to{" "}
              <strong>your own backend infrastructure</strong> — one of:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Firebase</strong> (Google Cloud) — your own Firebase
                project
              </li>
              <li>
                <strong>Supabase</strong> — your own Supabase project
              </li>
              <li>
                <strong>Convex</strong> — your own Convex deployment
              </li>
            </ul>
            <p className="mt-4">
              OpenLoom never acts as an intermediary. Video data flows directly
              from your device to your chosen backend. You retain full ownership
              and control over your recordings, including the ability to delete
              them at any time through your backend provider&apos;s dashboard or
              through the OpenLoom interface.
            </p>
          </div>

          {/* Chrome Extension Permissions */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Chrome Extension Permissions
            </h2>
            <p className="mb-4">
              The Chrome extension requests the following permissions, each for a
              specific functional purpose:
            </p>
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  sidePanel
                </h3>
                <p className="mt-1 text-sm">
                  Opens the recording controls and video library in Chrome&apos;s
                  side panel.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  offscreen
                </h3>
                <p className="mt-1 text-sm">
                  Creates an offscreen document to handle screen capture and
                  media recording. Chrome extensions cannot access media APIs
                  directly from the service worker, so an offscreen document is
                  required.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  storage
                </h3>
                <p className="mt-1 text-sm">
                  Persists your settings and backend configuration locally in
                  Chrome&apos;s extension storage.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  unlimitedStorage
                </h3>
                <p className="mt-1 text-sm">
                  Allows IndexedDB to store video recordings locally before
                  upload. Screen recordings can be large (hundreds of MBs), and
                  the default 10 MB quota is insufficient.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  alarms
                </h3>
                <p className="mt-1 text-sm">
                  Keeps the service worker alive during active recordings.
                  Chrome&apos;s service worker can be terminated after 30 seconds
                  of inactivity, which would interrupt an ongoing recording.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--cotton)]/10 p-4">
                <h3 className="font-mono text-sm font-bold text-[var(--mustard)]">
                  Host permissions (optional)
                </h3>
                <p className="mt-1 text-sm">
                  Network access to your chosen backend provider&apos;s APIs
                  (Firebase, Supabase, or Convex). These permissions are
                  requested only when you configure a specific backend provider
                  during setup. The extension only communicates with the provider
                  you select.
                </p>
              </div>
            </div>
          </div>

          {/* Shared Links */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Shared Video Links
            </h2>
            <p>
              When you share a recording, OpenLoom generates a link pointing to{" "}
              <code className="rounded bg-[var(--cotton)]/10 px-1.5 py-0.5 font-mono text-sm">
                openloom.live
              </code>
              . The web viewer at this URL is a{" "}
              <strong>static site hosted on GitHub Pages</strong>. It does not
              have a server or database. When someone opens a shared link, the
              viewer fetches the video directly from your backend using
              credentials encoded in the URL. The openloom.live site itself does
              not store, log, or process any video data.
            </p>
            <p className="mt-4">
              You may optionally enable <strong>password protection</strong> for
              shared links. Passwords are used to derive an AES-256-GCM
              encryption key client-side. The password is never transmitted or
              stored.
            </p>
          </div>

          {/* Third-Party Services */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Third-Party Services
            </h2>
            <p className="mb-4">
              OpenLoom connects only to the backend provider you explicitly
              configure. Each provider has its own privacy policy:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <a
                  href="https://firebase.google.com/support/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
                >
                  Google Firebase Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
                >
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://www.convex.dev/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
                >
                  Convex Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Data Retention */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Data Retention
            </h2>
            <p>
              Since all data is stored on your own infrastructure, data retention
              is entirely under your control. You can delete recordings at any
              time through the extension&apos;s library, the desktop app, or
              directly through your backend provider&apos;s dashboard.
              Uninstalling the extension removes all locally stored settings and
              cached data.
            </p>
          </div>

          {/* Open Source */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Open Source
            </h2>
            <p>
              OpenLoom is fully open source. You can review the complete source
              code, including all network requests and data handling, on{" "}
              <a
                href="https://github.com/anenthg/OpenLoom"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
              >
                GitHub
              </a>
              .
            </p>
          </div>

          {/* Changes */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Changes to This Policy
            </h2>
            <p>
              If we make changes to this privacy policy, the updated version will
              be posted on this page with a revised date. Since OpenLoom is open
              source, all changes are publicly visible in the{" "}
              <a
                href="https://github.com/anenthg/OpenLoom/commits/main"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
              >
                commit history
              </a>
              .
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="mb-4 font-sans text-2xl font-bold text-[var(--cotton)]">
              Contact
            </h2>
            <p>
              If you have questions about this privacy policy or OpenLoom&apos;s
              data practices, please{" "}
              <a
                href="https://github.com/anenthg/OpenLoom/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="border-b border-dotted border-[var(--cotton)]/30 transition-colors hover:text-[var(--cotton)]"
              >
                open a GitHub issue
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--cotton)]/5 bg-[var(--warp-indigo)] px-6 py-8">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between text-sm text-[var(--cotton)]/40">
          <span className="font-mono text-xs text-[var(--cotton)]/25">
            Design is inspired by enduring heritage of the{" "}
            <a
              href="https://en.wikipedia.org/wiki/Bhavani_Jamakkalam"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-dotted border-[var(--cotton)]/25 transition-colors hover:text-[var(--cotton)]/40"
            >
              Bhavani Jamakkalam
            </a>
            .
          </span>
          <span className="font-mono text-xs text-[var(--cotton)]/25 text-right">
            <span>
              Pair-programmed with Claude Code by{" "}
              <a
                href="https://x.com/anenth"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--cotton)]/40"
              >
                @anenth
              </a>
            </span>
            <br />
            <a
              href="https://buymeacoffee.com/anenthg"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--cotton)]/40"
            >
              ☕ Buy me a coffee
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
