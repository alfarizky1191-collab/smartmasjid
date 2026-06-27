export default function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-400 text-center py-6 text-sm">
      <p>Powered by <span className="text-emerald-400 font-semibold">SmartMasjid</span></p>
      <p className="mt-1 text-xs">© {new Date().getFullYear()} SmartMasjid. Semua hak dilindungi.</p>
    </footer>
  );
}
