export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-slate-800 mb-5 flex items-center gap-2">
      {children}
    </h2>
  );
}
