import Link from "next/link";

export default function Footer() {
  return (
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
          <span>Pair-programmed with Claude Code by{" "}
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
          {" · "}
          <Link
            href="/privacy"
            className="transition-colors hover:text-[var(--cotton)]/40"
          >
            Privacy
          </Link>
        </span>
      </div>
    </footer>
  );
}
