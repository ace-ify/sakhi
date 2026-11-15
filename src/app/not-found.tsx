import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold text-emerald-400 mb-2">404</h1>
      <p className="text-slate-300 mb-6">पृष्ठ नहीं मिला (Page Not Found)</p>
      <Link
        href="/"
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors"
      >
        मुख्य पृष्ठ पर वापस जाएं (Back to Home)
      </Link>
    </div>
  );
}

