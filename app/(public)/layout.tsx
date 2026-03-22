import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
            Ink<span className="text-zinc-500">Book</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Studio Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-zinc-200 bg-zinc-50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} InkBook. All rights reserved.</p>
          <p className="mt-1">
            Powered by{" "}
            <span className="font-medium text-zinc-700">InkBook</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
