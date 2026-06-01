import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardContent className="p-6 flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-emerald-400">
            Smart Masjid
          </h1>

          <p className="text-slate-400">
            Platform digital masjid modern.
          </p>

          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Mulai
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}