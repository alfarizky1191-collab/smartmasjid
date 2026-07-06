"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";
import { TVThemeProvider } from "@/lib/themes/ThemeProvider";
import RoyalOttomanLayout from "@/lib/themes/layouts/RoyalOttomanLayout";

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

  const isTestAdzanPlaying = useRef<boolean>(false);
  const isTestAlarmPlaying = useRef<boolean>(false);

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

    // REALTIME SLIDES — reload when admin adds/removes slides for this mosque
    const slidesChannel = supabase
      .channel(`slides-realtime-${mosqueId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "slides",
        filter: `mosque_id=eq.${mosqueId}`,
      }, async () => {
        const { data } = await supabase
          .from("slides")
          .select("*")
          .eq("mosque_id", mosqueId)
          .order("created_at", { ascending: false });
        if (data) setSlides(data);
      })
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

      supabase.removeChannel(
        slidesChannel
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

const prayerGrid = [
  ...(isRamadhan ? [{ name: 'Imsak', time: prayerTimes?.Imsak }] : []),
  { name: 'Subuh', time: prayerTimes?.Fajr },
  { name: 'Syuruk', time: prayerTimes?.Sunrise },
  { name: 'Dzuhur', time: prayerTimes?.Dhuhr },
  { name: 'Ashar', time: prayerTimes?.Asr },
  { name: 'Maghrib', time: prayerTimes?.Maghrib },
  { name: 'Isya', time: prayerTimes?.Isha },
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

  // Refs untuk state yang dibutuhkan di dalam interval (hindari stale closure)
  const isAdzanPlayingRef = useRef(false);
  const isIqomahRef = useRef(false);
  const autoAdzanEnabledRef = useRef(autoAdzanEnabled);
  const mosqueRef = useRef(mosque);
  const prayerTimesRef = useRef(prayerTimes);

  // Sync refs dengan state terbaru
  useEffect(() => { autoAdzanEnabledRef.current = autoAdzanEnabled; }, [autoAdzanEnabled]);
  useEffect(() => { mosqueRef.current = mosque; }, [mosque]);
  useEffect(() => { prayerTimesRef.current = prayerTimes; }, [prayerTimes]);
  useEffect(() => { isAdzanPlayingRef.current = isAdzanPlaying; }, [isAdzanPlaying]);
  useEffect(() => { isIqomahRef.current = isIqomah; }, [isIqomah]);

  // Helper: format waktu HH:MM dari Date (selalu pakai titik dua, konsisten dengan Aladhan)
  const formatHHMM = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      if (!autoAdzanEnabledRef.current) return;
      if (isAdzanPlayingRef.current || isIqomahRef.current) return;

      const currentMosque = mosqueRef.current;
      const currentPrayerTimes = prayerTimesRef.current;
      if (!currentPrayerTimes) return;

      const now = new Date();
      const currentTime = formatHHMM(now);

      const adzanList = [
        {
          name: "Subuh",
          time: currentPrayerTimes.Fajr,
          audio: currentMosque?.adzan_subuh_url || "/audio/adzan-subuh.mp3",
        },
        {
          name: "Dzuhur",
          time: currentPrayerTimes.Dhuhr,
          audio: currentMosque?.adzan_url || "/audio/adzan.mp3",
        },
        {
          name: "Ashar",
          time: currentPrayerTimes.Asr,
          audio: currentMosque?.adzan_url || "/audio/adzan.mp3",
        },
        {
          name: "Maghrib",
          time: currentPrayerTimes.Maghrib,
          audio: currentMosque?.adzan_url || "/audio/adzan.mp3",
        },
        {
          name: "Isya",
          time: currentPrayerTimes.Isha,
          audio: currentMosque?.adzan_url || "/audio/adzan.mp3",
        },
      ];

      for (const prayer of adzanList) {
        // Normalisasi: ambil hanya HH:MM dari waktu sholat (Aladhan kadang kirim "04:30 (WIB)")
        const prayerHHMM = prayer.time ? prayer.time.substring(0, 5) : null;
        const key = `${prayer.name}-${prayerHHMM}`;

        if (prayerHHMM && currentTime === prayerHHMM && triggeredRef.current !== key) {
          triggeredRef.current = key;

          setCurrentPrayer(prayer.name);
          setShowAdzan(true);
          setIsAdzanPlaying(true);
          isAdzanPlayingRef.current = true;

          setIqomahCountdown(currentMosque?.iqomah_duration || 300);

          // Gunakan audioRef yang sudah ada (src sudah diset di <audio> tag)
          // Tapi update src kalau beda (misal subuh)
          if (audioRef.current) {
            audioRef.current.src = prayer.audio;
            audioRef.current.volume = 1;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
              console.error("Gagal memutar adzan:", err);
            });

            audioRef.current.onended = () => {
              setShowAdzan(false);
              setIsAdzanPlaying(false);
              isAdzanPlayingRef.current = false;
              setIsIqomah(true);
              isIqomahRef.current = true;
              setIqomahCountdown(mosqueRef.current?.iqomah_duration || 300);
            };
          }

          break;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [prayerTimes]);

  // =========================
  // IQOMAH
  // =========================

  useEffect(() => {

    if (!isIqomah) return;

    const interval =
      setInterval(() => {

        setIqomahCountdown(
          (prev) => {

            if (prev <= 1) {

              clearInterval(interval);

              setIsIqomah(false);
              isIqomahRef.current = false;

              setShowPrayerMode(true);

              setTimeout(() => {
                setShowPrayerMode(false);
              }, 600000);

              // Play alarm when iqomah ends
              if (alarmRef.current) {
                alarmRef.current.currentTime = 0;
                alarmRef.current.play().catch(() => {});
              }

              return 0;
            }

            return prev - 1;
          }
        );

      }, 1000);

    return () => clearInterval(interval);

  }, [isIqomah]);

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
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl">
        Memuat data masjid...
      </main>
    );
  }

  if (!mosqueId) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl text-center px-6">
        {mosqueLookup.error ||
          "Masjid tidak ditemukan. Gunakan /tv/[slug] atau /tv?slug=slug-masjid."}
      </main>
    );
  }

  if (tvLoadError) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl text-center px-6">
        {tvLoadError}
      </main>
    );
  }

  if (!mosque) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl">
        Memuat data TV Display...
      </main>
    );
  }

  return (
    <TVThemeProvider themeId={mosque?.tv_theme ?? "classic"}>

    {/* ── Royal Ottoman Layout ── */}
    {mosque?.tv_theme === "royal-ottoman" && (
      <RoyalOttomanLayout
        mosque={mosque}
        time={time}
        prayerGrid={prayerGrid}
        nextPrayer={nextPrayer}
        countdown={countdown}
        showAdzan={showAdzan}
        currentPrayer={currentPrayer}
        iqomahCountdown={iqomahCountdown}
        showPrayerMode={showPrayerMode}
        autoAdzanEnabled={autoAdzanEnabled}
        setAutoAdzanEnabled={setAutoAdzanEnabled}
        stopAdzan={stopAdzan}
        goFullscreen={goFullscreen}
        onTestAdzan={() => {
          if (isTestAdzanPlaying.current) {
            audioRef.current?.pause();
            if (audioRef.current) audioRef.current.currentTime = 0;
            isTestAdzanPlaying.current = false;
          } else {
            if (audioRef.current) {
              audioRef.current.volume = 0.8;
              audioRef.current.play();
              isTestAdzanPlaying.current = true;
              audioRef.current.onended = () => { isTestAdzanPlaying.current = false; };
            }
          }
        }}
        onTestAlarm={() => {
          if (isTestAlarmPlaying.current) {
            alarmRef.current?.pause();
            if (alarmRef.current) alarmRef.current.currentTime = 0;
            isTestAlarmPlaying.current = false;
          } else {
            if (alarmRef.current) {
              alarmRef.current.volume = 0.8;
              alarmRef.current.play();
              isTestAlarmPlaying.current = true;
              alarmRef.current.onended = () => { isTestAlarmPlaying.current = false; };
            }
          }
        }}
        isFriday={isFriday}
        showJumatMode={showJumatMode}
        announcements={announcements}
        events={events}
        slides={slides}
        currentSlide={currentSlide}
        todayOfficers={todayOfficers}
        qrisUrl={qrisUrl}
        runningText={mosque?.running_text}
        runningTextSpeed={mosque?.running_text_speed}
      />
    )}

    {/* ── Default / Classic Layout ── */}
    {mosque?.tv_theme !== "royal-ottoman" && (
      <main
        className={`
        min-h-screen
        p-6
        flex
        flex-col
        gap-6
        overflow-hidden
        transition-all
        duration-500
        ${showAdzan ? "bg-yellow-950 text-white" : "text-white"}
      `}
      style={showAdzan ? undefined : {
        background: "var(--theme-background, #000)",
        color: "var(--theme-text-primary, #fff)",
        fontFamily: "var(--theme-font, inherit)",
      }}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-6">

          {mosque?.logo_url && (
            <img
              src={mosque.logo_url}
              alt="Logo"
              className="w-28 h-28 rounded-full object-cover bg-white"
              style={{
                border: "4px solid var(--theme-primary, #10b981)",
              }}
            />
          )}

          <div>

            <h1
              className="text-6xl font-bold"
              style={{ color: "var(--theme-primary, #10b981)" }}
            >
              {mosque?.name}
            </h1>

            <p
              className="text-3xl mt-2"
              style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
            >
              {getLocationLabel(mosque)}
            </p>

          </div>

        </div>

        <div className="flex items-center gap-4">

          <button
            onClick={goFullscreen}
            className="px-8 py-4 rounded-2xl text-black font-bold text-2xl"
            style={{ backgroundColor: "var(--theme-primary, #10b981)" }}
          >
            Fullscreen
          </button>
<button
  onClick={() => {
    if (isTestAdzanPlaying.current) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      isTestAdzanPlaying.current = false;
    } else {
      if (audioRef.current) {
        audioRef.current.volume = 0.8;
        audioRef.current.play();
        isTestAdzanPlaying.current = true;
        audioRef.current.onended = () => { isTestAdzanPlaying.current = false; };
      }
    }
  }}
  className="bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold"
>

  ▶ / ■ Test Adzan

</button>

<button
  onClick={() => {
    if (isTestAlarmPlaying.current) {
      alarmRef.current?.pause();
      if (alarmRef.current) alarmRef.current.currentTime = 0;
      isTestAlarmPlaying.current = false;
    } else {
      if (alarmRef.current) {
        alarmRef.current.volume = 0.8;
        alarmRef.current.play();
        isTestAlarmPlaying.current = true;
        alarmRef.current.onended = () => { isTestAlarmPlaying.current = false; };
      }
    }
  }}
  className="bg-yellow-500 text-black px-6 py-4 rounded-2xl font-bold"
>

  ▶ / ■ Test Alarm

</button>
          <button
            onClick={() =>
              setAutoAdzanEnabled(
                !autoAdzanEnabled
              )
            }
            className="px-8 py-4 rounded-2xl text-black font-bold text-2xl"
            style={{ backgroundColor: "var(--theme-primary, #10b981)" }}
          >

            {autoAdzanEnabled
              ? "Auto Adzan ON"
              : "Auto Adzan OFF"}

          </button>

          <div className="text-6xl font-bold">

            {time}

          </div>

        </div>

      </div>

      {/* BANNER JUMAT */}
      {isFriday && (

        <div className="bg-yellow-400 text-black rounded-3xl p-6 text-center">

          <h1 className="text-5xl font-bold">
            🕌 JUMAT MUBARAK
          </h1>

          <p className="text-3xl mt-2">
            Perbanyak Sholawat & Datang Lebih Awal
          </p>

        </div>

      )}

      {/* MODE JUMAT */}
      {showJumatMode && (

        <div className="bg-yellow-400 text-black rounded-3xl p-8 flex flex-col gap-6">

          <h1 className="text-6xl font-bold text-center">
            🕌 SHOLAT JUMAT
          </h1>

          <div className="grid grid-cols-3 gap-6">

            <div className="bg-black/10 rounded-2xl p-6 text-center">

              <p className="text-2xl font-semibold">
                KHATIB
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {khatib}
              </h2>

            </div>

            <div className="bg-black/10 rounded-2xl p-6 text-center">

              <p className="text-2xl font-semibold">
                IMAM
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {imamJumat}
              </h2>

            </div>

            <div className="bg-black/10 rounded-2xl p-6 text-center">

              <p className="text-2xl font-semibold">
                MUADZIN
              </p>

              <h2 className="text-4xl font-bold mt-3">
                {muadzin}
              </h2>

            </div>

          </div>

          <div className="text-center mt-4">

            <p className="text-3xl font-bold">
              📵 Mohon Silent Handphone
            </p>

          </div>

        </div>

      )}

      {/* COUNTDOWN */}
      <div
        className={`
          rounded-3xl
          p-8
          text-center
          transition-all
          duration-500
          ${showAdzan ? "bg-yellow-400 text-black animate-pulse" : "text-black"}
        `}
        style={showAdzan ? undefined : {
          backgroundColor: "var(--theme-primary, #10b981)",
        }}
      >

        {showPrayerMode ? (

          <div className="flex flex-col items-center justify-center gap-8 py-10">

            <h1 className="text-7xl font-bold">
              🕌 SHOLAT SEDANG BERLANGSUNG
            </h1>

            <p className="text-5xl font-semibold">
              Mohon Tenang & Matikan HP
            </p>

            <p className="text-4xl">
              Rapikan dan luruskan shaf
            </p>

          </div>

        ) : (

          <>

            <h2 className="text-5xl font-bold">

              {showAdzan
                ? `🕌 ADZAN ${currentPrayer}`
                : `Adzan ${nextPrayer} dalam`}

            </h2>

            <p className="text-[120px] font-bold mt-4">

              {countdown}

            </p>

            {showAdzan && (

              <div className="mt-6 flex flex-col gap-4">

                <p className="text-5xl font-bold animate-bounce">
                  Hayya 'alash Shalah
                </p>

                <p className="text-3xl">
                  Mari tinggalkan aktivitas sejenak
                </p>

                <p className="text-2xl">
                  📵 Mohon tenang & matikan HP
                </p>

              </div>

            )}

            {/* IQOMAH */}
            <div className="mt-6">

              <p className="text-3xl font-bold">
                IQOMAH
              </p>

              <p className="text-6xl font-bold">

                {formatIqomah(
                  iqomahCountdown
                )}

              </p>

            </div>

            {showAdzan && (

              <button
                onClick={
                  stopAdzan
                }
                className="mt-8 bg-red-500 px-8 py-4 rounded-2xl text-white text-3xl font-bold"
              >
                Stop Adzan
              </button>

            )}

          </>

        )}

      </div>


      {/* JADWAL */}
      <div className="grid grid-cols-7 gap-4">

        {prayerGrid.map(
          (item) => (
            <div
              key={item.name}
              className="rounded-3xl p-6 text-center"
              style={{
                backgroundColor: "var(--theme-surface, #0f172a)",
                borderRadius: "var(--theme-radius, 1.5rem)",
              }}
            >
              <h2
                className="text-3xl font-bold"
                style={{ color: "var(--theme-prayer-highlight, #10b981)" }}
              >
                {item.name}
              </h2>

              <p
                className="text-5xl font-bold mt-6"
                style={{ color: "var(--theme-text-primary, #fff)" }}
              >
                {item.time}
              </p>
            </div>
          )
        )}

      </div>

{/* SLIDER */}
<div
  className="rounded-3xl overflow-hidden h-[350px] relative mb-6"
  style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
>

  {slides.length > 0 ? (

    <img
      src={
        slides[currentSlide]
          ?.image_url
      }
      alt="Slide"
      className="w-full h-full object-cover"
    />

  ) : (

    <div className="flex items-center justify-center h-full text-white text-3xl">

      Belum ada slide

    </div>

  )}
{qrisUrl && (
  <div
    className="rounded-3xl p-8 flex flex-col items-center justify-center gap-6"
    style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
  >
    <h2
      className="text-5xl font-bold"
      style={{ color: "var(--theme-primary, #10b981)" }}
    >
      Donasi Masjid
    </h2>

    <img
      src={qrisUrl}
      alt="QRIS"
      className="w-[350px] rounded-3xl"
      style={{ border: "4px solid var(--theme-primary, #10b981)" }}
    />

    <p
      className="text-3xl text-center"
      style={{ color: "var(--theme-text-primary, #fff)" }}
    >
      Scan QRIS untuk infaq & donasi masjid
    </p>
  </div>
)}
</div>

      {/* PETUGAS HARI INI */}
      <div
        className="rounded-3xl p-6"
        style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
      >
        <h2
          className="text-4xl font-bold mb-6 text-center"
          style={{ color: "var(--theme-primary, #10b981)" }}
        >
          Petugas Hari Ini
        </h2>
        {todayOfficers.length === 0 ? (
          <p
            className="text-2xl text-center"
            style={{ color: "var(--theme-text-secondary, #64748b)" }}
          >
            Belum ada jadwal petugas hari ini
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayOfficers.map((o, i) => (
              <div
                key={i}
                className="flex justify-between items-center rounded-2xl px-6 py-4"
                style={{ backgroundColor: "var(--theme-border, #1e293b)" }}
              >
                <span
                  className="text-2xl font-semibold capitalize"
                  style={{ color: "var(--theme-time-accent, #fbbf24)" }}
                >
                  {o.role}
                </span>
                <span
                  className="text-2xl"
                  style={{ color: "var(--theme-text-primary, #fff)" }}
                >
                  {o.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
      >
        <h2
          className="text-4xl font-bold mb-6 text-center"
          style={{ color: "var(--theme-primary, #10b981)" }}
        >
          Jadwal Kegiatan
        </h2>

        <div className="flex flex-col gap-4">
          {events.map(
            (item) => (
              <div
                key={item.id}
                className="rounded-2xl p-4"
                style={{ backgroundColor: "var(--theme-border, #1e293b)" }}
              >
                <h3
                  className="text-3xl font-bold"
                  style={{ color: "var(--theme-text-primary, #fff)" }}
                >
                  {item.title}
                </h3>

                <p
                  className="text-xl mt-2"
                  style={{ color: "var(--theme-text-secondary, #94a3b8)" }}
                >
                  {item.speaker}
                </p>

                <p
                  className="mt-2"
                  style={{ color: "var(--theme-text-secondary, #64748b)" }}
                >
                  {formatIndonesianDateWithDay(item.event_date)}
                  {" • "}
                  {item.event_time}
                </p>
              </div>
            )
          )}
        </div>
      </div>
      {/* PENGUMUMAN */}
      <div
        className="rounded-3xl p-6 flex flex-col gap-4 flex-1 overflow-hidden"
        style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
      >
        <h2
          className="text-4xl font-bold"
          style={{ color: "var(--theme-primary, #10b981)" }}
        >
          Pengumuman
        </h2>

        {announcements.map(
          (item) => (
            <div
              key={item.id}
              className="rounded-2xl p-6"
              style={{ backgroundColor: "var(--theme-border, #1e293b)" }}
            >
              <p
                className="text-4xl text-center font-bold"
                style={{ color: "var(--theme-text-primary, #fff)" }}
              >
                {item.title}
              </p>
            </div>
          )
        )}
      </div>

      {/* RUNNING TEXT */}
      <div
        className="w-full overflow-hidden rounded-3xl py-4"
        style={{ backgroundColor: "var(--theme-surface, #0f172a)" }}
      >
        <div
          className="text-4xl font-bold whitespace-nowrap"
          style={{
            color: "var(--theme-primary, #10b981)",
            display: "inline-block",
            minWidth: "100%",
            paddingLeft: "100%",
            animation: `marquee ${mosque?.running_text_speed || 20}s linear infinite`,
          }}
        >
          {mosque?.running_text}
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`

        
        

        @keyframes marquee {

          0% {
            transform: translateX(0%);
          }

          100% {
            transform: translateX(-100%);
          }
        }

      `}</style>

<audio
  ref={audioRef}
  src={mosque?.adzan_url || "/audio/adzan.mp3"}
/>

<audio
  ref={alarmRef}
  src={mosque?.alarm_url || "/audio/alarm.wav"}
/>

    </main>
    )}
    {/* ── End Default Layout ── */}

    </TVThemeProvider>
  );
}
  
