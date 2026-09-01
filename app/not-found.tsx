import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-4 text-center">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">404 - Page Not Found</h2>
      <p className="text-sm text-slate-600 dark:text-zinc-400 mt-2">Could not find requested resource</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-lg">
        Return Home
      </Link>
    </div>
  )
}
