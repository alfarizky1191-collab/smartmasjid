"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

type MosqueLookup = {
  id: string | null;
  slug: string | null;
  isReady: boolean;
  error: string | null;
};

const LOCATION_FALLBACK = "Lokasi belum diatur";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const trimText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getLocationLabel = (mosque: any) => {
  const location = [
    trimText(mosque?.city),
    trimText(mosque?.province),
  ].filter(Boolean);

  return location.length > 0 ? location.join(", ") : LOCATION_FALLBACK;
};

const getTvSlugFromPath = (pathname: string) => {
  const [basePath, slug] = pathname.split("/").filter(Boolean);
  return basePath === "tv" && slug ? decodeURIComponent(slug) : "";
};

const getParam = (params: URLSearchParams, key: string) =>
  params.get(key)?.trim() || "";

const fetchPrayerTimesForCity = async (city: string) => {
  const response = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
      city
    )}&country=Indonesia&method=11`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Gagal memuat jadwal sholat");
  }

  const result = await response.json();
  return result?.data?.timings || null;
};

export default function TVPage() {

  // =========================
  // MOSQUE FROM URL
  // =========================

  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [mosqueLookup, setMosqueLookup] = useState<MosqueLookup>({
    id: null,
    slug: null,
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const resolveMosque = async () => {
      try {
        localStorage.removeItem("mosque");
        localStorage.removeItem("prayerTimes");

        const params = new URLSearchParams(window.location.search);
        const mosqueParam = getParam(params, "mosque");
        const idParam =
          getParam(params, "mosque_id") || getParam(params, "id");
        const pathSlug = getTvSlugFromPath(window.location.pathname);
        const slugParam =
          pathSlug ||
          getParam(params, "slug") ||
          getParam(params, "mosque_slug") ||
          (!idParam && mosqueParam && !UUID_PATTERN.test(mosqueParam)
            ? mosqueParam
            : "");
        const idFromParam =
          idParam ||
          (mosqueParam && UUID_PATTERN.test(mosqueParam) ? mosqueParam : "");

        if (slugParam) {
          const { data, error } = await supabase
            .from("mosques")
            .select("id, slug")
            .eq("slug", slugParam)
            .maybeSingle();

          if (!isMounted) return;

          if (error || !data?.id) {
            setMosqueId(null);
            setMosqueLookup({
              id: null,
              slug: slugParam,
              isReady: true,
              error: "Masjid dengan slug ini tidak ditemukan.",
            });
            return;
          }

          setMosqueId(data.id);
          setMosqueLookup({
            id: data.id,
            slug: data.slug || slugParam,
            isReady: true,
            error: null,
          });
          return;
        }

        if (idFromParam) {
          setMosqueId(idFromParam);
          setMosqueLookup({
            id: idFromParam,
            slug: null,
            isReady: true,
            error: null,
          });
          return;
        }

        setMosqueId(null);
        setMosqueLookup({
          id: null,
          slug: null,
          isReady: true,
          error:
            "Masjid tidak ditemukan. Gunakan /tv/[slug] atau /tv?slug=slug-masjid.",
        });
      } catch (error) {
        console.error("Gagal membaca URL TV Display", error);

        if (!isMounted) return;

        setMosqueId(null);
        setMosqueLookup({
          id: null,
          slug: null,
          isReady: true,
          error: "Gagal memuat data masjid.",
        });
      }
    };

    resolveMosque();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================
  // STATES
  // =========================

  const [time, setTime] =
    useState("");

  const [mosque, setMosque] =
    useState<any>(null);

  const [tvLoadError, setTvLoadError] =
    useState("");

  const [announcements, setAnnouncements] =
    useState<any[]>([]);

  const [prayerTimes, setPrayerTimes] =
    useState<any>(null);

  const [nextPrayer, setNextPrayer] =
    useState("");

  const [countdown, setCountdown] =
    useState("");

  const [showAdzan, setShowAdzan] =
    useState(false);

  const [currentPrayer, setCurrentPrayer] =
    useState("");

  const [autoAdzanEnabled, setAutoAdzanEnabled] =
    useState(true);

  const [iqomahCountdown, setIqomahCountdown] =
    useState(300);

  const [showPrayerMode, setShowPrayerMode] =
    useState(false);

  const [isAdzanPlaying, setIsAdzanPlaying] =
  useState(false);

const [isIqomah, setIsIqomah] =
  useState(false);  

  const [isFriday, setIsFriday] =
    useState(false);

  const [showJumatMode, setShowJumatMode] =
    useState(false);

  const [khatib] =
    useState("Ustadz Ahmad");

  const [imamJumat] =
    useState("Ustadz Fulan");

  const [muadzin] =
    useState("Ahmad");

  const [qrisUrl, setQrisUrl] =
  useState("");

  const [
  events,
  setEvents,
] = useState<any[]>([]);

const [todayOfficers, setTodayOfficers] = useState<{role: string; name: string}[]>([]);
    

  // =========================
  // SLIDER
  // =========================

  const [slides, setSlides] =
  useState<any[]>([]);

  const [currentSlide, setCurrentSlide] =
    useState(0);

    

  // =========================
  // REFS
  // =========================

  const audioRef =
    useRef<HTMLAudioElement | null>(null);
  const alarmRef =
  useRef<HTMLAudioElement | null>(
    null
  );  

  const triggeredRef =
    useRef<string | null>(null);

  const refreshPrayerTimes =
    useCallback(async (cityValue: unknown) => {
      const city = trimText(cityValue);

      if (!city) {
        setPrayerTimes(null);
        setNextPrayer("");
        setCountdown("");
        return;
      }

      try {
        const timings = await fetchPrayerTimesForCity(city);
        setPrayerTimes(timings);
      } catch (error) {
        console.error("Gagal memuat jadwal sholat", error);
        setPrayerTimes(null);
      }
    }, []);

  // =========================
  // CLOCK
  // =========================

  useEffect(() => {

    const updateClock = () => {

      const now =
        new Date();

      const day =
        now.getDay();

      const hour =
        now.getHours();

      setIsFriday(
        day === 5
      );

      setShowJumatMode(
        day === 5 &&
        hour >= 10 &&
        hour <= 13
      );

      setTime(

        now.toLocaleTimeString(
          "id-ID",
          {
            hour:
              "2-digit",
            minute:
              "2-digit",
            second:
              "2-digit",
          }
        )

      );
    };

    updateClock();

    const interval =
      setInterval(
        updateClock,
        1000
      );

    return () =>
  clearInterval(
    interval
  );

}, [prayerTimes]);

  // =========================
  // FETCH DATA
  // =========================

  useEffect(() => {

    if (!mosqueId) return;

    const loadEvents =
      async () => {

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

    const {
      data,
    } = await supabase

      .from("events")

      .select("*")

      .eq("mosque_id", mosqueId)

      .gte(
        "event_date",
        today
      )

      .order(
        "event_date",
        {
          ascending:
            true,
        }
      )

      .limit(3);

    if (data) {

      setEvents(data);
    }
  };

    const loadTodayOfficers = async () => {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
      const { data } = await supabase
        .from("officer_schedules")
        .select("role, officers(name)")
        .eq("mosque_id", mosqueId)
        .eq("schedule_date", today);
      if (data) {
        setTodayOfficers(
          data.map((d: any) => ({ role: d.role, name: d.officers?.name || "-" }))
        );
      }
    };

    const loadQris =
      async () => {

        const {
          data,
        } = await supabase

          .from(
            "qris_settings"
          )

          .select("*")

          .eq("mosque_id", mosqueId)

          .single();

        if (
          data?.image_url
        ) {

          setQrisUrl(
            data.image_url
          );
        }
      };

    const fetchData =
      async () => {

        try {

          setMosque(null);
          setAnnouncements([]);
          setPrayerTimes(null);
          setNextPrayer("");
          setCountdown("");
          setQrisUrl("");
          setEvents([]);
          setTodayOfficers([]);
          setSlides([]);
          setTvLoadError("");

          await loadQris();

          await loadEvents();

          await loadTodayOfficers();

          // MOSQUE
          const {
            data:
              mosqueData,
            error:
              mosqueError,
          } = await supabase

            .from("mosques")

            .select("*")

            .eq("id", mosqueId)

            .single();

          if (
            mosqueError ||
            !mosqueData
          ) {

            setTvLoadError(
              "Data masjid tidak ditemukan."
            );
            return;
          }

          if (
            mosqueData
          ) {

            const mosqueItem =
              mosqueData;

            setMosque(
              mosqueItem
            );

            if (
              mosqueItem
                ?.iqomah_duration
            ) {

              setIqomahCountdown(
                mosqueItem.iqomah_duration
              );
            }

            await refreshPrayerTimes(
              mosqueItem.city
            );
          }
// SLIDES
const {
  data: slidesData,
} = await supabase

  .from("slides")

  .select("*")

  .eq("mosque_id", mosqueId)

  .order(
    "created_at",
    {
      ascending: false,
    }
  );

if (slidesData) {

  setSlides(
    slidesData
  );
}
          // ANNOUNCEMENTS
          const {
            data:
              announcementData,
          } = await supabase

            .from(
              "announcements"
            )

            .select("*")

            .eq("mosque_id", mosqueId)

            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

          if (
            announcementData
          ) {

            setAnnouncements(
              announcementData
            );
          }

        } catch (error) {

          console.error(
            "Gagal memuat data TV Display",
            error
          );
          setTvLoadError(
            "Gagal memuat data TV Display."
          );
        }
      };

    fetchData();

    // =========================
    // REALTIME MOSQUE
    // =========================

    const mosqueChannel =
      supabase

        .channel(
          `mosque-realtime-${mosqueId}`
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "mosques",
            filter:
              `id=eq.${mosqueId}`,
          },
          async () => {

            const {
              data,
            } = await supabase

              .from("mosques")

              .select("*")

              .eq("id", mosqueId)

              .single();

            if (
              data
            ) {

              setMosque(
                data
              );

              setMosqueLookup(
                (current) => ({
                  ...current,
                  id: data.id,
                  slug: data.slug || current.slug,
                })
              );

              if (
                data?.iqomah_duration
              ) {

                setIqomahCountdown(
                  data.iqomah_duration
                );
              }

              await refreshPrayerTimes(
                data.city
              );
            }
          }
        )
        

        .subscribe();

    // =========================
    // REALTIME ANNOUNCEMENT
    // =========================

    const announcementChannel =
      supabase

        .channel(
          `announcement-realtime-${mosqueId}`
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "announcements",
            filter:
              `mosque_id=eq.${mosqueId}`,
          },
          async () => {

            const {
              data,
            } = await supabase

              .from(
                "announcements"
              )

              .select("*")

              .eq("mosque_id", mosqueId)

              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

            if (data) {

              setAnnouncements(
                data
              );
            }
          }
        )

        .subscribe();

    // =========================
    // REALTIME EVENT
    // =========================

    const eventChannel =
      supabase

        .channel(
          `event-realtime-${mosqueId}`
        )

        .on(
          "postgres_changes",
          {
            event:
              "*",
            schema:
              "public",
            table:
              "events",
            filter:
              `mosque_id=eq.${mosqueId}`,
          },
          () => {

            loadEvents();
          }
        )

        .subscribe();

    const officerChannel = supabase
      .channel(`officer-realtime-${mosqueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "officer_schedules",
        filter: `mosque_id=eq.${mosqueId}`,
      }, () => { loadTodayOfficers(); })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "officers",
        filter: `mosque_id=eq.${mosqueId}`,
      }, () => { loadTodayOfficers(); })
      .subscribe();

    return () => {

      supabase.removeChannel(
        mosqueChannel
      );

      supabase.removeChannel(
        announcementChannel
      );

      supabase.removeChannel(
        eventChannel
      );

      supabase.removeChannel(
        officerChannel
      );

    };

  }, [mosqueId, refreshPrayerTimes]);

  // =========================
  // AUTO REFRESH JADWAL
  // =========================

  useEffect(() => {
    

    const interval =
      setInterval(async () => {

        const now =
          new Date();

        const hour =
          now.getHours();

        const minute =
          now.getMinutes();

        // REFRESH JAM 00:01
        if (
          hour === 0 &&
          minute === 1
        ) {

          await refreshPrayerTimes(
            mosque?.city
          );
        }

      }, 60000);

    return () =>
      clearInterval(
        interval
      );

  }, [mosque, refreshPrayerTimes]);

  // =========================
  // AUTO SLIDE
  // =========================

  useEffect(() => {

    if (
    slides.length === 0
  ) return;

    const interval =
      setInterval(() => {

        setCurrentSlide(
          (prev) =>

            (prev + 1) %
            slides.length
        );

      }, 5000);

    return () =>
      clearInterval(
        interval
      );

  }, [slides.length]);

  

  // =========================
  // PRAYERS
  // =========================

  const isRamadhan =

  new Date()

    .toLocaleDateString(
      "en-TN-u-ca-islamic"
    )

    .includes("Ramadan");

const prayers = [

  ...(isRamadhan
    ? [

        {
          name: "Imsak",

          time:
            prayerTimes?.Imsak,
        },

      ]
    : []),

  {
    name: "Subuh",

    time:
      prayerTimes?.Fajr,
  },

  {
    name: "Dzuhur",

    time:
      prayerTimes?.Dhuhr,
  },

  {
    name: "Ashar",

    time:
      prayerTimes?.Asr,
  },

  {
    name: "Maghrib",

    time:
      prayerTimes?.Maghrib,
  },

  {
    name: "Isya",

    time:
      prayerTimes?.Isha,
  },
];

  // =========================
  // COUNTDOWN
  // =========================

  useEffect(() => {

    if (!prayerTimes)
      return;

    type UpcomingPrayer = {
      name: string;
      date: Date;
    };

    const updateCountdown =
      () => {

        const now = new Date();

let upcomingPrayer: UpcomingPrayer | null = null;

for (
  const prayer
  of prayers
) {

  if (
    !prayer.time
  ) continue;

  const [
    hour,
    minute,
  ] =
    prayer.time
      .split(":")
      .map(Number);

  const prayerDate =
    new Date();

  prayerDate.setHours(
    hour,
    minute,
    0,
    0
  );

  if (
    prayerDate > now
  ) {

    upcomingPrayer = {
      name:
        prayer.name,

      date:
        prayerDate,
    };

    break;
  }
}

if (!upcomingPrayer) {

  if (!prayers[0]?.time)
    return;

  const [
    hour,
    minute,
  ] =
    prayers[0].time
      .split(":")
      .map(Number);

  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() +
      1
  );

  tomorrow.setHours(
    hour,
    minute,
    0,
    0
  );

  upcomingPrayer = {
    name:
      prayers[0].name,

    date:
      tomorrow,
  };
}

const diff =
  upcomingPrayer.date.getTime() -
  now.getTime();

const totalSeconds =
  Math.floor(
    diff / 1000
  );

const hrs =
  Math.floor(
    totalSeconds / 3600
  );

const mins =
  Math.floor(
    (
      totalSeconds %
      3600
    ) / 60
  );

const secs =
  totalSeconds % 60;

setNextPrayer(
  upcomingPrayer.name
);

setCountdown(

  `${String(
    hrs
  ).padStart(
    2,
    "0"
  )}:${String(
    mins
  ).padStart(
    2,
    "0"
  )}:${String(
    secs
  ).padStart(
    2,
    "0"
  )}`

);

};
updateCountdown();


const interval =
  setInterval(
    updateCountdown,
    1000
  );

return () =>
  clearInterval(
    interval
  );

  }, [prayerTimes]);


  // =========================
  // AUTO ADZAN
  // =========================

  useEffect(() => {

    if (
      !prayerTimes ||
      !autoAdzanEnabled
    ) return;

    const now =
  new Date();

const current =
  now.toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );

if (
  isAdzanPlaying ||
  isIqomah
) return;

for (
  const prayer
  of prayers
) {

  if (
    prayer.time === current &&
    triggeredRef.current !==
      prayer.name
  ) {

    triggeredRef.current =
      prayer.name;

    setCurrentPrayer(
      prayer.name
    );

    setShowAdzan(true);

    setIsAdzanPlaying(
      true
    );

    if (
      audioRef.current
    ) {

      audioRef.current.volume =
        1;

      audioRef.current.play();

      audioRef.current.onended =
        () => {

          setShowAdzan(
            false
          );

          setIsAdzanPlaying(
            false
          );

          setIsIqomah(
            true
          );

          setIqomahCountdown(
            mosque?.iqomah_duration ||
              300
          );
        };
    }

    break;
  }
}
    const interval =
      setInterval(() => {

        const now =
          new Date();

        const currentTime =
          now.toLocaleTimeString(
            "id-ID",
            {
              hour:
                "2-digit",
              minute:
                "2-digit",
              hour12:
                false,
            }
          );

        const adzanList = [

          {
            name:
              "Subuh",
            time:
              prayerTimes.Fajr,
            audio:
              mosque?.adzan_subuh_url || "/audio/adzan-subuh.mp3",
          },

          {
            name:
              "Dzuhur",
            time:
              prayerTimes.Dhuhr,
            audio:
              mosque?.adzan_url || "/audio/adzan.mp3",
          },

          {
            name:
              "Ashar",
            time:
              prayerTimes.Asr,
            audio:
              mosque?.adzan_url || "/audio/adzan.mp3",
          },

          {
            name:
              "Maghrib",
            time:
              prayerTimes.Maghrib,
            audio:
              mosque?.adzan_url || "/audio/adzan.mp3",
          },

          {
            name:
              "Isya",
            time:
              prayerTimes.Isha,
            audio:
              mosque?.adzan_url || "/audio/adzan.mp3",
          },
        ];

        for (
          const prayer
          of adzanList
        ) {

          const key =
            `${prayer.name}-${currentTime}`;

          if (
            currentTime ===
              prayer.time &&
            triggeredRef.current !==
              key
          ) {

            triggeredRef.current =
              key;

            setShowAdzan(
              true
            );

            setCurrentPrayer(
              prayer.name
            );

            setIqomahCountdown(
              mosque
                ?.iqomah_duration ||
                300
            );

            const audio =
              new Audio(
                prayer.audio
              );

            audioRef.current =
              audio;

            audio.play();

            // AUTO HIDE ADZAN
            setTimeout(() => {

              setShowAdzan(
                false
              );

            }, 300000);

            break;
          }
        }

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, [
    prayerTimes,
    autoAdzanEnabled,
    mosque,
  ]);

  // =========================
  // IQOMAH
  // =========================

  useEffect(() => {

    if (
      !showAdzan
    ) return;

    const interval =
      setInterval(() => {

        setIqomahCountdown(
          (prev) => {

            if (
              prev <= 1
            ) {

              clearInterval(
                interval
              );

              setShowPrayerMode(
                true
              );

              setTimeout(() => {

                setShowPrayerMode(
                  false
                );

              }, 600000);

              return 0;
            }

            return prev - 1;
          }
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, [showAdzan]);

  // =========================
  // FORMAT IQOMAH
  // =========================

  const formatIqomah =
    (
      seconds: number
    ) => {

      const mins =
        Math.floor(
          seconds / 60
        );

      const secs =
        seconds % 60;

      return `${String(
        mins
      ).padStart(
        2,
        "0"
      )}:${String(
        secs
      ).padStart(
        2,
        "0"
      )}`;
    };

  // =========================
  // STOP ADZAN
  // =========================

  const stopAdzan =
    () => {

      if (
        audioRef.current
      ) {

        audioRef.current.pause();

        audioRef.current.currentTime =
          0;
      }

      setShowAdzan(
        false
      );

      triggeredRef.current =
        null;
    };

  // =========================
  // FULLSCREEN
  // =========================

  const goFullscreen =
    () => {

      document.documentElement.requestFullscreen();
    };

  // =========================
  // UI
  // =========================

  if (!mosqueLookup.isReady) {
    return (
      <main className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white text-2xl">
        Memuat data masjid...
      </main>
    );
  }

  if (!mosqueId) {
    return (
      <main className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white text-2xl text-center px-6">
        {mosqueLookup.error || "Masjid tidak ditemukan. Gunakan /tv/[slug] atau /tv?slug=slug-masjid."}
      </main>
    );
  }

  if (tvLoadError) {
    return (
      <main className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white text-2xl text-center px-6">
        {tvLoadError}
      </main>
    );
  }

  if (!mosque) {
    return (
      <main className="min-h-screen bg-[#0a1628] flex items-center justify-center text-white text-2xl">
        Memuat data TV Display...
      </main>
    );
  }

  // Current date string
  const dateNow = new Date();
  const dateLabel = dateNow.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <main
      className="w-screen h-screen overflow-hidden flex flex-col text-white select-none"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 60%, #0a1628 100%)" }}
    >
      {/* ── ADZAN OVERLAY ─────────────────────────────────── */}
      {showAdzan && (
        <div className="absolute inset-0 z-50 bg-yellow-500/95 flex flex-col items-center justify-center gap-6 animate-pulse">
          <p className="text-8xl font-black text-slate-900">🕌 ADZAN {currentPrayer}</p>
          <p className="text-5xl font-bold text-slate-900">Hayya 'alash Shalah</p>
          <p className="text-3xl text-slate-800">📵 Mohon tenang & matikan HP</p>
          <button onClick={stopAdzan} className="mt-4 bg-red-600 text-white px-10 py-4 rounded-2xl text-2xl font-bold">
            Stop Adzan
          </button>
        </div>
      )}

      {/* ── SHOLAT MODE OVERLAY ───────────────────────────── */}
      {showPrayerMode && (
        <div className="absolute inset-0 z-50 bg-emerald-800/95 flex flex-col items-center justify-center gap-6">
          <p className="text-8xl font-black">🕌 SHOLAT SEDANG BERLANGSUNG</p>
          <p className="text-5xl">Mohon Tenang & Matikan HP</p>
          <p className="text-4xl text-emerald-300">Rapikan dan luruskan shaf</p>
        </div>
      )}

      {/* ── MAIN LAYOUT: LEFT | RIGHT ─────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ══ LEFT: PRAYER TIMES COLUMN ══════════════════════ */}
        <div
          className="flex flex-col justify-between py-6 px-5 shrink-0"
          style={{ width: "22%", background: "linear-gradient(180deg, #0e2248 0%, #0a1a38 100%)", borderRight: "2px solid #1e3a6e" }}
        >
          {/* Prayer rows */}
          <div className="flex flex-col gap-1 flex-1 justify-center">
            {prayers.map((p) => {
              const isNext = p.name === nextPrayer;
              return (
                <div
                  key={p.name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isNext ? "bg-blue-600/80 shadow-lg shadow-blue-900/50" : "bg-transparent"
                  }`}
                >
                  <span className="text-2xl shrink-0">
                    {p.name === "Subuh" ? "🌅" : p.name === "Dzuhur" ? "☀️" : p.name === "Ashar" ? "🌤️" : p.name === "Maghrib" ? "🌇" : p.name === "Isya" ? "🌙" : "⭐"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-semibold ${isNext ? "text-white" : "text-blue-200"}`}>{p.name}</p>
                    <p className={`text-3xl font-black tabular-nums leading-tight ${isNext ? "text-white" : "text-blue-100"}`}>
                      {p.time ?? "--:--"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Control buttons */}
          <div className="flex flex-col gap-2 mt-4">
            <button onClick={goFullscreen} className="bg-blue-700/60 hover:bg-blue-700 text-xs text-blue-200 px-3 py-2 rounded-lg">
              Fullscreen
            </button>
            <button
              onClick={() => setAutoAdzanEnabled(!autoAdzanEnabled)}
              className={`text-xs px-3 py-2 rounded-lg ${autoAdzanEnabled ? "bg-emerald-700/60 text-emerald-200" : "bg-slate-700/60 text-slate-400"}`}
            >
              {autoAdzanEnabled ? "Auto Adzan ON" : "Auto Adzan OFF"}
            </button>
            <button onClick={() => audioRef.current?.play()} className="bg-slate-700/40 hover:bg-slate-700 text-xs text-slate-300 px-3 py-2 rounded-lg">
              Test Adzan
            </button>
            <button onClick={() => alarmRef.current?.play()} className="bg-slate-700/40 hover:bg-slate-700 text-xs text-slate-300 px-3 py-2 rounded-lg">
              Test Alarm
            </button>
          </div>
        </div>

        {/* ══ RIGHT: MAIN CONTENT ════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── TOP HEADER BAR ── */}
          <div
            className="flex items-center justify-between px-8 py-4 shrink-0"
            style={{ background: "linear-gradient(90deg, #0e2248 0%, #142d55 100%)", borderBottom: "2px solid #1e3a6e" }}
          >
            {/* Mosque identity */}
            <div className="flex items-center gap-4">
              {mosque?.logo_url && (
                <img src={mosque.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 bg-white shrink-0" />
              )}
              <div>
                <h1 className="text-3xl font-black leading-tight">
                  <span className="text-white">Masjid </span>
                  <span className="text-yellow-400">{mosque?.name?.replace(/^Masjid\s*/i, "")}</span>
                </h1>
                <p className="text-blue-300 text-sm mt-0.5 truncate max-w-lg">{mosque?.address || getLocationLabel(mosque)}</p>
              </div>
            </div>
            {/* Date & time */}
            <div className="text-right shrink-0">
              <p className="text-blue-300 text-sm">• {dateLabel}</p>
              <p className="text-4xl font-black text-white tabular-nums">{time}</p>
            </div>
          </div>

          {/* ── JUMAT BANNER ── */}
          {isFriday && (
            <div className="bg-yellow-500 text-slate-900 text-center py-2 px-4 text-xl font-bold shrink-0">
              🕌 JUMAT MUBARAK — Perbanyak Sholawat & Datang Lebih Awal
            </div>
          )}

          {/* ── MIDDLE: QRIS + CONTENT / SLIDES ── */}
          <div className="flex flex-1 overflow-hidden gap-0">

            {/* QRIS panel */}
            {qrisUrl && (
              <div
                className="flex flex-col items-center justify-center gap-4 px-6 py-5 shrink-0"
                style={{ width: "36%", borderRight: "2px solid #1e3a6e", background: "rgba(10,26,56,0.6)" }}
              >
                <img src={qrisUrl} alt="QRIS" className="w-44 h-44 object-contain rounded-2xl border-4 border-white bg-white" />
                <p className="text-center text-base font-semibold text-blue-100 leading-snug">
                  GIVING INFAQ IS MUCH EASIER WITH QRIS. JUST SCAN THE QR CODE BELOW WITH YOUR PHONE.
                </p>
              </div>
            )}

            {/* Slides / announcements / events */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {slides.length > 0 ? (
                <div className="flex-1 relative overflow-hidden">
                  <img
                    src={slides[currentSlide]?.image_url}
                    alt="Slide"
                    className="w-full h-full object-cover"
                  />
                  {/* announcement overlay */}
                  {announcements.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-6 py-3">
                      <p className="text-lg font-semibold text-white truncate">{announcements[0]?.title}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center px-8 py-6 gap-4 overflow-hidden">
                  {/* Announcements */}
                  {announcements.slice(0, 2).map((a) => (
                    <div key={a.id} className="bg-blue-900/40 border border-blue-700/40 rounded-xl px-5 py-3">
                      <p className="text-lg font-semibold text-white">{a.title}</p>
                    </div>
                  ))}
                  {/* Events */}
                  {events.slice(0, 2).map((e) => (
                    <div key={e.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-5 py-3">
                      <p className="font-bold text-yellow-400">{e.title}</p>
                      <p className="text-sm text-slate-300">{formatIndonesianDateWithDay(e.event_date)} • {e.event_time}</p>
                    </div>
                  ))}
                  {/* Officers */}
                  {todayOfficers.length > 0 && (
                    <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl px-5 py-3">
                      <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">Petugas Hari Ini</p>
                      {todayOfficers.map((o, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-yellow-400 capitalize">{o.role}</span>
                          <span className="text-white">{o.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── COUNTDOWN + IQOMAH BAR ── */}
          <div
            className="flex items-center justify-between px-8 py-3 shrink-0"
            style={{ background: "linear-gradient(90deg, #0d3b6e 0%, #0a2a50 100%)", borderTop: "2px solid #1e3a6e" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-blue-300 text-lg font-semibold">🕐 {nextPrayer}</span>
              <span className="text-white text-3xl font-black tabular-nums">{countdown}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-300 text-sm font-semibold">Iqomah</span>
              <span className="text-yellow-400 text-2xl font-black tabular-nums">{formatIqomah(iqomahCountdown)}</span>
            </div>
          </div>

          {/* ── RUNNING TEXT ── */}
          <div
            className="shrink-0 overflow-hidden py-2"
            style={{ background: "#07111f", borderTop: "1px solid #1e3a6e" }}
          >
            <div
              className="text-lg font-semibold text-blue-300 whitespace-nowrap"
              style={{
                display: "inline-block",
                paddingLeft: "100%",
                animation: `marquee ${mosque?.running_text_speed || 20}s linear infinite`,
              }}
            >
              • {mosque?.running_text} •
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <audio ref={audioRef} src={mosque?.adzan_url || "/audio/adzan.mp3"} />
      <audio ref={alarmRef} src={mosque?.alarm_url || "/audio/alarm.wav"} />
    </main>
  );
}
  
