import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center select-none">
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center border border-red-500/20 mx-auto">
          <span className="text-3xl font-extrabold text-red-500">404</span>
        </div>
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-600/30 transition active:scale-95"
      >
        Go to puchIn Portal
      </Link>
    </div>
  );
}
