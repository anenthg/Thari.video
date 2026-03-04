"use client";

import { useEffect } from "react";
import Link from "next/link";
import DownloadButton from "../DownloadButton";

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ?? "0";
            setTimeout(() => {
              el.setAttribute("data-visible", "");
            }, Number(delay));
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.15 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function PricingPage() {
  useScrollReveal();

  return (
    <main className="overflow-x-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative flex min-h-[55dvh] flex-col items-center justify-center px-6">
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
              ~/openloom/pricing
            </span>
          </div>

          <h1 className="font-sans text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-[var(--cotton)]">
            What It Costs
            <br />
            <span className="text-[var(--cotton)]/50">Spoiler: probably nothing.</span>
          </h1>

          <div className="mt-6 font-mono text-sm leading-relaxed">
            <div className="text-[var(--mustard)]">
              <span className="text-[var(--emerald)]">$</span> OpenLoom is
              free and open source. Your recordings live on Firebase&apos;s
              generous free tier — here&apos;s exactly what you get.
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* THE SHORT VERSION                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--warp-indigo)] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-4 text-center text-4xl font-bold tracking-tight text-[var(--cotton)]"
            data-reveal
          >
            The Short Version
          </h2>
          <p
            className="mx-auto mb-16 max-w-2xl text-center text-lg text-[var(--cotton)]/50"
            data-reveal
            data-delay="100"
          >
            A fresh Firebase project on the Blaze plan gives you real recording
            time at zero cost. You only pay if you outgrow the free tier.
          </p>

          <div className="grid gap-6 md:grid-cols-3" data-reveal data-delay="200">
            {/* Card: HD */}
            <div className="stripe-hover-border rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-8 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--crimson)]">
                HD Mode
              </p>
              <p className="mt-3 text-5xl font-bold text-[var(--cotton)]">~3h</p>
              <p className="mt-1 text-sm text-[var(--cotton)]/40">
                of recording for free
              </p>
              <div className="mt-4 space-y-1 text-xs text-[var(--cotton)]/30">
                <p>1920 &times; 1080 &middot; 5 Mbps</p>
                <p>~30 MB / minute</p>
              </div>
            </div>

            {/* Card: Non-HD */}
            <div className="stripe-hover-border rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-8 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--mustard)]">
                Non-HD Mode
              </p>
              <p className="mt-3 text-5xl font-bold text-[var(--cotton)]">~6h</p>
              <p className="mt-1 text-sm text-[var(--cotton)]/40">
                of recording for free
              </p>
              <div className="mt-4 space-y-1 text-xs text-[var(--cotton)]/30">
                <p>1280 &times; 720 &middot; 2.5 Mbps</p>
                <p>~15 MB / minute</p>
              </div>
            </div>

            {/* Card: After free tier */}
            <div className="stripe-hover-border rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-8 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--emerald)]">
                Beyond Free
              </p>
              <p className="mt-3 text-5xl font-bold text-[var(--cotton)]">$0.02</p>
              <p className="mt-1 text-sm text-[var(--cotton)]/40">
                per GB / month after 5 GB
              </p>
              <div className="mt-4 space-y-1 text-xs text-[var(--cotton)]/30">
                <p>50 GB of recordings</p>
                <p>would cost ~$1/month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FREE TIER BREAKDOWN                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--warp-indigo)] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-4 text-center text-4xl font-bold tracking-tight text-[var(--cotton)]"
            data-reveal
          >
            Firebase Free Tier{" "}
            <span className="text-[var(--cotton)]/40">Breakdown</span>
          </h2>
          <p
            className="mx-auto mb-16 max-w-2xl text-center text-lg text-[var(--cotton)]/50"
            data-reveal
            data-delay="100"
          >
            The Blaze plan is pay-as-you-go but includes no-cost quotas.
            Here&apos;s what matters for OpenLoom.
          </p>

          <div className="space-y-6" data-reveal data-delay="200">
            {/* Cloud Storage */}
            <div className="rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mustard)]/10 text-[var(--mustard)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--cotton)]">
                      Cloud Storage
                    </h3>
                    <span className="rounded-full bg-[var(--mustard)]/10 px-3 py-1 font-mono text-xs text-[var(--mustard)]">
                      bottleneck
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--cotton)]/50">
                    Where your video files live. This is the only limit that
                    matters for most users.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--mustard)]">5 GB</p>
                      <p className="text-xs text-[var(--cotton)]/40">free storage</p>
                    </div>
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--mustard)]">100 GB</p>
                      <p className="text-xs text-[var(--cotton)]/40">free egress / month</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-[var(--mustard)]/15 bg-[var(--mustard)]/[0.04] px-4 py-3">
                    <p className="text-xs font-medium text-[var(--mustard)]">
                      Region matters
                    </p>
                    <p className="mt-1 text-xs text-[var(--cotton)]/40">
                      The 5 GB free storage only applies to US regions:{" "}
                      <span className="font-mono text-[var(--cotton)]/60">us-central1</span>,{" "}
                      <span className="font-mono text-[var(--cotton)]/60">us-east1</span>, or{" "}
                      <span className="font-mono text-[var(--cotton)]/60">us-west1</span>.
                      Pick one of these when creating your Storage bucket. Any other
                      region is billed from the first byte.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firestore */}
            <div className="rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--emerald)]/10 text-[var(--emerald)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--cotton)]">
                      Cloud Firestore
                    </h3>
                    <span className="rounded-full bg-[var(--emerald)]/10 px-3 py-1 font-mono text-xs text-[var(--emerald)]">
                      not a concern
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--cotton)]/50">
                    Stores video metadata, view counts, and emoji reactions.
                    Each recording is a few KB — you&apos;d need thousands of
                    recordings before this matters.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--emerald)]">1 GiB</p>
                      <p className="text-xs text-[var(--cotton)]/40">stored data</p>
                    </div>
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--emerald)]">50K</p>
                      <p className="text-xs text-[var(--cotton)]/40">reads / day</p>
                    </div>
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--emerald)]">20K</p>
                      <p className="text-xs text-[var(--cotton)]/40">writes / day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cloud Functions */}
            <div className="rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-6 md:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--crimson)]/10 text-[var(--crimson)]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--cotton)]">
                      Cloud Functions
                    </h3>
                    <span className="rounded-full bg-[var(--crimson)]/10 px-3 py-1 font-mono text-xs text-[var(--crimson)]">
                      not a concern
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--cotton)]/50">
                    The public API that serves your videos. Each view triggers
                    one invocation. You&apos;d need ~65,000 views per day to hit
                    the limit.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--crimson)]">2M</p>
                      <p className="text-xs text-[var(--cotton)]/40">invocations / month</p>
                    </div>
                    <div className="rounded-lg bg-[var(--cotton)]/[0.03] px-4 py-3">
                      <p className="font-mono text-2xl font-bold text-[var(--crimson)]">400K</p>
                      <p className="text-xs text-[var(--cotton)]/40">GB-seconds compute</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* VIEWING BUDGET                                                   */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--warp-indigo)] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-4 text-center text-4xl font-bold tracking-tight text-[var(--cotton)]"
            data-reveal
          >
            Viewing Budget
          </h2>
          <p
            className="mx-auto mb-16 max-w-2xl text-center text-lg text-[var(--cotton)]/50"
            data-reveal
            data-delay="100"
          >
            100 GB of free egress per month means your videos can be watched
            plenty of times before you pay a cent.
          </p>

          <div className="mx-auto max-w-lg" data-reveal data-delay="200">
            <div className="rounded-2xl border border-[var(--cotton)]/8 bg-[var(--cotton)]/[0.03] p-6 md:p-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cotton)]/8">
                    <th className="pb-3 text-left font-mono text-xs uppercase tracking-widest text-[var(--cotton)]/30">
                      Video
                    </th>
                    <th className="pb-3 text-right font-mono text-xs uppercase tracking-widest text-[var(--cotton)]/30">
                      Free views / month
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[var(--cotton)]/60">
                  <tr className="border-b border-[var(--cotton)]/5">
                    <td className="py-3">2 min HD (~60 MB)</td>
                    <td className="py-3 text-right font-mono text-[var(--cotton)]">~1,600</td>
                  </tr>
                  <tr className="border-b border-[var(--cotton)]/5">
                    <td className="py-3">5 min HD (~150 MB)</td>
                    <td className="py-3 text-right font-mono text-[var(--cotton)]">~660</td>
                  </tr>
                  <tr className="border-b border-[var(--cotton)]/5">
                    <td className="py-3">5 min non-HD (~75 MB)</td>
                    <td className="py-3 text-right font-mono text-[var(--cotton)]">~1,300</td>
                  </tr>
                  <tr>
                    <td className="py-3">10 min HD (~300 MB)</td>
                    <td className="py-3 text-right font-mono text-[var(--cotton)]">~330</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* TLDR                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="bg-[var(--warp-indigo)] px-6 py-24">
        <div
          className="mx-auto flex max-w-2xl flex-col items-center text-center"
          data-reveal
        >
          <h2 className="text-4xl font-bold tracking-tight text-[var(--cotton)]">
            TL;DR
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[var(--cotton)]/50">
            Storage is the only limit that matters. Pick a US region, get 5 GB
            free. That&apos;s <span className="text-[var(--cotton)]">3 hours of HD</span> or{" "}
            <span className="text-[var(--cotton)]">6 hours of 720p</span> recording
            without spending anything. Everything else — Firestore, Functions,
            egress — is free for normal usage.
          </p>
          <p className="mt-4 text-sm text-[var(--cotton)]/30">
            If you outgrow 5 GB, it&apos;s $0.02/GB/month. That&apos;s about the
            cost of a packet of biscuits for 50 GB of recordings.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <DownloadButton />
            <Link
              href="/technology"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--cotton)]/15 px-6 py-3 text-base font-medium text-[var(--cotton)]/70 transition-all hover:border-[var(--cotton)]/30 hover:text-[var(--cotton)]"
            >
              How it works
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FOOTER                                                           */}
      {/* ---------------------------------------------------------------- */}
      <footer className="border-t border-[var(--cotton)]/5 bg-[var(--warp-indigo)] px-6 py-8">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between text-sm text-[var(--cotton)]/40">
          <span className="font-mono text-xs text-[var(--cotton)]/25">
            Source:{" "}
            <a
              href="https://docs.cloud.google.com/free/docs/free-cloud-features"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-dotted border-[var(--cotton)]/25 transition-colors hover:text-[var(--cotton)]/40"
            >
              GCP Always Free tier
            </a>
            {" "}&middot;{" "}
            <a
              href="https://firebase.google.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-dotted border-[var(--cotton)]/25 transition-colors hover:text-[var(--cotton)]/40"
            >
              Firebase Pricing
            </a>
          </span>
          <span className="font-mono text-xs text-[var(--cotton)]/25">
            Estimates based on VP9/WebM at stated bitrates
          </span>
        </div>
      </footer>
    </main>
  );
}
