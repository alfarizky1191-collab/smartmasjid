"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { 
  Clock, 
  Tv, 
  DollarSign, 
  Heart, 
  Calendar, 
  Users,
  ArrowRight,
  Zap,
  Shield
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Prayer Times",
    description: "Accurate prayer schedules with countdown timers and prayer notifications",
  },
  {
    icon: Tv,
    title: "TV Display",
    description: "Beautiful display system for mosques with slides, announcements, and prayer schedules",
  },
  {
    icon: DollarSign,
    title: "Finance",
    description: "Complete financial management system for your mosque with transparent reporting",
  },
  {
    icon: Heart,
    title: "Donations",
    description: "Integrated donation tracking with QR code payments and receipt generation",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Organize mosque events and activities with scheduling and attendee management",
  },
  {
    icon: Users,
    title: "Officers",
    description: "Manage mosque staff roles and daily duty schedules efficiently",
  },
];

export default function Home() {
  const [superAdminExists, setSuperAdminExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "super_admin")
          .limit(1);

        if (!error && data) {
          setSuperAdminExists(data.length > 0);
        } else {
          setSuperAdminExists(false);
        }
      } catch {
        setSuperAdminExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdmin();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white font-bold" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">SmartMasjid</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Admin Login
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md hover:shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 mb-6">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Modern Mosque Management</span>
          </div>

          <h2 className="text-5xl sm:text-6xl font-bold mb-6 text-slate-900 leading-tight">
            Manage Your Mosque <span className="bg-gradient-to-r from-emerald-600 to-amber-500 bg-clip-text text-transparent">Intelligently</span>
          </h2>

          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            SmartMasjid is a comprehensive management platform designed specifically for mosques. Handle prayer times, donations, events, and more—all in one place.
          </p>

          <div className="flex justify-center mb-16">
            <Link
              href="/login"
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Login Admin
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Setup Section (Conditional) */}
      {superAdminExists === false && !isLoading && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-gradient-to-br from-blue-50 to-emerald-50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-100 mb-4">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Getting Started</span>
            </div>
            <h3 className="text-4xl font-bold mb-3 text-slate-900">
              Buat SmartMasjid Pertama
            </h3>
            <p className="text-slate-600 mb-8 text-lg max-w-xl mx-auto">
              Jadilah super admin pertama dan mulai mengelola masjid Anda dengan SmartMasjid.
            </p>
            <Link
              href="/register"
              className="inline-flex px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Setup Pertama
            </Link>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
              Powerful Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage your mosque efficiently and effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 p-8 transition-all hover:shadow-lg hover:border-emerald-200"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-emerald-500/0 transition-all" />
                  
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-6 group-hover:from-emerald-200 transition-colors shadow-sm">
                      <Icon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-900">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
            Login to your admin dashboard and start managing your mosque today.
          </p>
          <Link
            href="/login"
            className="inline-flex px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Go to Login
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">SmartMasjid</span>
            </div>
            <p className="text-slate-600 text-sm">
              © 2024 SmartMasjid. Made for mosques, by muslims.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
