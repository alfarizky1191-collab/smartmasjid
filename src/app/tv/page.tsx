"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatIndonesianDateWithDay, getJakartaDateKey } from "@/lib/date-utils";
import { TVThemeProvider } from "@/lib/themes/ThemeProvider";
import RoyalOttomanLayout from "@/lib/themes/layouts/RoyalOttomanLayout";
import { getTheme } from "@/lib/themes";

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

function IslamicCornerOrnament({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 H100 V10 C100 50 50 100 10 100 H0 Z" fill="currentColor" opacity="0.1" />
      <path d="M0 2 V98 H98" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M0 6 V94 H94" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
      <path d="M40 0 C40 20 20 40 0 40" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
      <circle cx="20" cy="20" r="3" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

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

    const today = getJakartaDateKey();

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
      const today = getJakartaDateKey();
      const { data } = await supabase
        .from("officer_schedules")
        .select("role, officers(name)")
        .eq("mosque_id", mosqueId)
        .eq("schedule_date", today);
      if (data) {
        setTodayOfficers(
          data.map((d: any) => {
            const officerName = Array.isArray(d.officers)
              ? (d.officers[0]?.name || "-")
              : (d.officers?.name || "-");
            return { role: d.role, name: officerName };
          })
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

      let isAnyPrayerNow = false;
      for (const prayer of adzanList) {
        // Normalisasi: ambil hanya HH:MM dari waktu sholat (Aladhan kadang kirim "04:30 (WIB)")
        const prayerHHMM = prayer.time ? prayer.time.substring(0, 5) : null;
        const key = `${prayer.name}-${prayerHHMM}`;

        if (prayerHHMM && currentTime === prayerHHMM) {
          isAnyPrayerNow = true;
          if (triggeredRef.current !== key) {
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
      }

      if (!isAnyPrayerNow) {
        triggeredRef.current = null;
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

      setIsAdzanPlaying(false);
      isAdzanPlayingRef.current = false;
      setIsIqomah(true);
      isIqomahRef.current = true;
      setIqomahCountdown(mosque?.iqomah_duration || 300);
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

  const theme = getTheme(mosque?.tv_theme ?? "classic");

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

    {/* ── Adzan Overlay for Default Themes ── */}
    {showAdzan && mosque?.tv_theme !== "royal-ottoman" && (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-8 text-white p-8 animate-page-fade"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          color: "var(--theme-text-primary, #fff)",
          fontFamily: "var(--theme-font, inherit)",
        }}
      >
        <div className="text-8xl animate-bounce">🕌</div>
        <h1 className="text-8xl font-bold text-[var(--theme-primary,#10b981)] text-center animate-pulse tracking-wide">
          ADZAN {currentPrayer.toUpperCase()}
        </h1>
        <p className="text-5xl text-[var(--theme-time-accent,#fbbf24)] font-medium animate-pulse">Hayya 'alash Shalah</p>
        <p className="text-3xl text-gray-300">Mari tinggalkan aktivitas sejenak</p>
        <p className="text-3xl text-gray-300">📵 Mohon tenang & matikan HP</p>
        <div className="mt-4 bg-[var(--theme-surface,#0f172a)]/80 rounded-3xl px-12 py-8 border border-[var(--theme-border)] shadow-xl">
          <p className="text-2xl text-center text-gray-400 font-semibold uppercase tracking-widest">IQOMAH</p>
          <p className="text-7xl font-bold text-center text-[var(--theme-time-accent,#fbbf24)] font-mono mt-3">
            {formatIqomah(iqomahCountdown)}
          </p>
        </div>
        <button onClick={stopAdzan} className="mt-6 bg-red-600 px-12 py-4 rounded-2xl text-white text-3xl font-bold hover:bg-red-700 transition shadow-lg cursor-pointer">
          Stop Adzan
        </button>
      </div>
    )}

    {/* ── Prayer Mode Overlay for Default Themes ── */}
    {showPrayerMode && mosque?.tv_theme !== "royal-ottoman" && (
      <div className="min-h-screen w-full bg-black flex items-center justify-center text-center p-8 animate-page-fade">
        <p className="text-5xl md:text-6xl font-bold text-white tracking-wide leading-relaxed max-w-5xl">
          {mosque?.shaf_message || "Harap rapatkan dan luruskan barisan shaf sholat"}
        </p>
      </div>
    )}

    {/* ── Default / Classic Layout ── */}
    {!showAdzan && !showPrayerMode && mosque?.tv_theme !== "royal-ottoman" && (
      <main
        className="h-screen w-full flex flex-col overflow-hidden p-5 gap-4 select-none animate-page-fade relative"
        style={{
          background: "var(--theme-background, #f3f4f6)",
          color: "var(--theme-text-primary, #111827)",
          fontFamily: "var(--theme-font, 'Inter', sans-serif)",
        }}
      >
        {/* Dynamic Islamic Star Pattern Overlay */}
        {theme?.ornament?.showPattern && (
          <div
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l7.5 22.5L60 30l-22.5 7.5L30 60l-7.5-22.5L0 30l22.5-7.5z' fill='${encodeURIComponent(
                theme.colors.ornament || theme.colors.primary
              )}'/%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
              opacity: (theme.ornament.patternOpacity || 15) / 100,
            }}
          />
        )}

        {/* Dynamic Mosque Silhouette Background */}
        {theme?.ornament?.showMosqueSilhouette && (
          <div
            className="absolute inset-0 z-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1920&q=80")`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          />
        )}

        {/* Dynamic Corner Ornaments */}
        {theme?.ornament?.showPattern && (
          <>
            <IslamicCornerOrnament className="absolute top-4 left-4 w-16 h-16 text-[var(--theme-primary)] opacity-40 rotate-0 pointer-events-none z-10" />
            <IslamicCornerOrnament className="absolute top-4 right-4 w-16 h-16 text-[var(--theme-primary)] opacity-40 -rotate-90 pointer-events-none z-10" />
            <IslamicCornerOrnament className="absolute bottom-4 left-4 w-16 h-16 text-[var(--theme-primary)] opacity-40 rotate-90 pointer-events-none z-10" />
            <IslamicCornerOrnament className="absolute bottom-4 right-4 w-16 h-16 text-[var(--theme-primary)] opacity-40 rotate-180 pointer-events-none z-10" />
          </>
        )}

        {/* HEADER */}
        <div className="flex items-center justify-between flex-shrink-0 bg-[var(--theme-surface,#fff)]/80 backdrop-blur-sm p-4 rounded-2xl border border-[var(--theme-border)]/50 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            {mosque?.logo_url ? (
              <img
                src={mosque.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-full object-cover shadow-sm bg-white"
                style={{ border: "2px solid var(--theme-primary, #10b981)" }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/10 flex items-center justify-center text-[var(--theme-primary)]">
                <svg viewBox="0 0 64 64" className="w-9 h-9" fill="currentColor"><path d="M32 4 C28 4 24 8 24 12 L24 16 L8 16 L8 56 L56 56 L56 16 L40 16 L40 12 C40 8 36 4 32 4Z M28 12 C28 10 30 8 32 8 C34 8 36 10 36 12 L36 16 L28 16 Z M12 20 L52 20 L52 52 L38 52 L38 36 C38 32 35 28 32 28 C29 28 26 32 26 36 L26 52 L12 52 Z" /></svg>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--theme-primary, #10b981)]">
                {mosque?.name}
              </h1>
              <p className="text-lg text-[var(--theme-text-secondary, #6b7280)] mt-0.5 font-medium">
                {getLocationLabel(mosque)} {mosque?.tagline && ` • ${mosque.tagline}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Control buttons */}
            <div className="flex gap-2">
              <button
                onClick={goFullscreen}
                className="px-4 py-2 text-sm rounded-xl font-bold bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border border-[var(--theme-primary)]/20 hover:bg-[var(--theme-primary)]/20 transition-all cursor-pointer"
              >
                ⛶ Fullscreen
              </button>
              <button
                onClick={() => setAutoAdzanEnabled(!autoAdzanEnabled)}
                className={`px-4 py-2 text-sm rounded-xl font-bold transition-all border cursor-pointer ${
                  autoAdzanEnabled
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                }`}
              >
                {autoAdzanEnabled ? "🔔 Adzan ON" : "🔕 Adzan OFF"}
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
                className="px-4 py-2 text-sm rounded-xl font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
              >
                ▶ Test Adzan
              </button>
            </div>

            {/* Time Display */}
            <div className="flex items-baseline gap-2 bg-[var(--theme-surface,#fff)] px-5 py-2 rounded-2xl border border-[var(--theme-border)] shadow-sm">
              <span className="text-4xl font-black font-mono text-[var(--theme-time-accent, #059669)] tracking-wider">
                {time}
              </span>
              <span className="text-xs font-bold text-[var(--theme-text-secondary)]">WIB</span>
            </div>
          </div>
        </div>

        {/* JUMAT BANNER (if Friday) */}
        {isFriday && (
          <div className="flex-shrink-0 bg-yellow-500/10 border border-yellow-500/30 text-[var(--theme-text-primary)] rounded-2xl px-6 py-2.5 text-center flex items-center justify-center gap-3 relative z-10">
            <span className="text-xl">🕌</span>
            <p className="text-lg font-bold tracking-wide">
              JUMAT MUBARAK — Perbanyak Sholawat, Rapikan Shaf, &amp; Datang Lebih Awal
            </p>
          </div>
        )}

        {/* JUMAT MODE (if active) */}
        {showJumatMode && (
          <div className="flex-shrink-0 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3 relative z-10">
            <h2 className="text-xl font-bold text-center text-amber-700 uppercase tracking-widest">Jadwal Sholat Jumat</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--theme-surface)]/60 p-3 rounded-xl border border-[var(--theme-border)] text-center shadow-sm">
                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-wider block">KHATIB</span>
                <span className="text-lg font-bold text-[var(--theme-text-primary)] mt-1 block">{khatib || "-"}</span>
              </div>
              <div className="bg-[var(--theme-surface)]/60 p-3 rounded-xl border border-[var(--theme-border)] text-center shadow-sm">
                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-wider block">IMAM</span>
                <span className="text-lg font-bold text-[var(--theme-text-primary)] mt-1 block">{imamJumat || "-"}</span>
              </div>
              <div className="bg-[var(--theme-surface)]/60 p-3 rounded-xl border border-[var(--theme-border)] text-center shadow-sm">
                <span className="text-xs font-semibold text-[var(--theme-text-secondary)] tracking-wider block">MUADZIN</span>
                <span className="text-lg font-bold text-[var(--theme-text-primary)] mt-1 block">{muadzin || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE GRID */}
        <div className="flex-1 grid grid-cols-12 gap-5 min-h-0 relative z-10">
          
          {/* LEFT COLUMN: Media & Announcements (col-span-8) */}
          <div className="col-span-8 flex flex-col gap-4 min-h-0">
            {/* Slider */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-[var(--theme-border)]/50 shadow-md">
              {slides.length > 0 ? (
                <img
                  src={slides[currentSlide]?.image_url}
                  alt="Slide"
                  className="w-full h-full object-cover animate-page-scale"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--theme-surface)]">
                  <span className="text-[var(--theme-text-secondary)] text-xl font-medium">Belum ada slide gambar</span>
                </div>
              )}
              {/* Glass corners decor */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-[var(--theme-primary)]/40 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-[var(--theme-primary)]/40 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[var(--theme-primary)]/40 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[var(--theme-primary)]/40 rounded-br-2xl" />
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="h-[120px] flex-shrink-0 bg-[var(--theme-surface)]/80 backdrop-blur-sm rounded-2xl p-5 flex flex-col justify-center border border-[var(--theme-border)] shadow-sm">
                <span className="text-xs font-bold text-[var(--theme-primary)] tracking-widest uppercase mb-1">📢 Pengumuman</span>
                <p className="text-2xl font-bold text-[var(--theme-text-primary)] truncate leading-snug">
                  {announcements[0]?.title}
                </p>
                {announcements[1] && (
                  <p className="text-lg text-[var(--theme-text-secondary)] truncate mt-1">
                    {announcements[1]?.title}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Countdown & Side info (col-span-4) */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            {/* Countdown Card */}
            <div
              className="rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden flex-shrink-0"
              style={{
                background: "linear-gradient(145deg, var(--theme-primary, #10b981) 0%, var(--theme-secondary, #059669) 100%)",
                color: "#fff"
              }}
            >
              {/* Geometric pattern overlay */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0 L40 20 L20 40 L0 20 Z' fill='%23fff'/%3E%3C/svg%3E")`,
                backgroundSize: '20px 20px'
              }} />
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-white/80">Adzan {nextPrayer} dalam</span>
                <span className="text-6xl font-black font-mono tracking-wider mt-2 block filter drop-shadow-md">
                  {countdown}
                </span>
                {isIqomah && iqomahCountdown > 0 && (
                  <div className="mt-2.5 px-3 py-1 bg-white/20 rounded-full border border-white/20 flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" />
                    <span className="text-xs font-semibold tracking-wider">IQOMAH {formatIqomah(iqomahCountdown)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Side Info Panels (QRIS / Petugas / Events) */}
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
              
              {/* Row 1: QRIS or Events */}
              {qrisUrl ? (
                <div className="bg-[var(--theme-surface)]/80 backdrop-blur-sm rounded-2xl p-4 border border-[var(--theme-border)] flex items-center gap-4 shadow-sm min-h-0 flex-1">
                  <div className="flex-shrink-0 h-full max-h-[120px] aspect-square bg-white p-1.5 rounded-xl border border-[var(--theme-border)] flex items-center justify-center">
                    <img src={qrisUrl} alt="QRIS" className="h-full w-full object-contain rounded-lg" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <span className="text-xs font-bold text-[var(--theme-primary)] tracking-wider uppercase">Infaq & Donasi</span>
                    <h3 className="text-base font-bold text-[var(--theme-text-primary)] mt-1">Scan QRIS Masjid</h3>
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-1 leading-relaxed line-clamp-2">
                      Dukung operasional dan kegiatan masjid dengan scan QRIS di samping.
                    </p>
                  </div>
                </div>
              ) : events.length > 0 ? (
                <div className="bg-[var(--theme-surface)]/80 backdrop-blur-sm rounded-2xl p-4 border border-[var(--theme-border)] shadow-sm min-h-0 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-[var(--theme-primary)] tracking-wider uppercase mb-2">📅 Agenda Terdekat</span>
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                    {events.slice(0, 2).map((ev) => (
                      <div key={ev.id} className="bg-[var(--theme-background)]/50 p-2.5 rounded-xl border border-[var(--theme-border)]/50">
                        <h4 className="text-sm font-bold text-[var(--theme-text-primary)] truncate">{ev.title}</h4>
                        <div className="flex justify-between items-center text-xs text-[var(--theme-text-secondary)] mt-1">
                          <span className="truncate">{ev.speaker || "Umum"}</span>
                          <span className="flex-shrink-0 ml-2 font-medium">{ev.event_time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Row 2: Petugas Hari Ini */}
              <div className="bg-[var(--theme-surface)]/80 backdrop-blur-sm rounded-2xl p-4 border border-[var(--theme-border)] shadow-sm flex flex-col min-h-0 flex-1">
                <span className="text-xs font-bold text-[var(--theme-primary)] tracking-wider uppercase mb-2">👥 Petugas Hari Ini</span>
                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 justify-center">
                  {todayOfficers.length === 0 ? (
                    <p className="text-sm text-center text-[var(--theme-text-secondary)] py-2">Belum ada jadwal petugas</p>
                  ) : (
                    todayOfficers.slice(0, 3).map((o, i) => (
                      <div key={i} className="flex justify-between items-center bg-[var(--theme-background)]/50 px-3 py-1.5 rounded-xl border border-[var(--theme-border)]/30">
                        <span className="text-xs font-bold text-[var(--theme-time-accent,#059669)] capitalize">{o.role}</span>
                        <span className="text-xs font-semibold text-[var(--theme-text-primary)] truncate max-w-[140px]">{o.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Prayer Times */}
        <div className="flex-shrink-0 grid grid-cols-7 gap-3 relative z-10">
          {prayerGrid.map((item) => {
            const isNext = item.name === nextPrayer;
            return (
              <div
                key={item.name}
                className={`rounded-2xl p-3.5 text-center border transition-all duration-300 ${
                  isNext
                    ? "border-[var(--theme-primary)] shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.03] z-10"
                    : "border-[var(--theme-border)]/60 shadow-sm"
                }`}
                style={{
                  backgroundColor: isNext ? "var(--theme-primary)" : "var(--theme-surface, #fff)",
                }}
              >
                <span
                  className={`text-xs font-bold tracking-wider uppercase block ${
                    isNext ? "text-white" : "text-[var(--theme-text-secondary)]"
                  }`}
                >
                  {item.name}
                </span>
                <span
                  className={`text-2xl font-black font-mono tracking-tight mt-1.5 block ${
                    isNext ? "text-white" : "text-[var(--theme-text-primary)]"
                  }`}
                >
                  {item.time || "--:--"}
                </span>
              </div>
            );
          })}
        </div>

        {/* FOOTER: Running Text marquee */}
        {mosque?.running_text && (
          <div className="flex-shrink-0 h-10 overflow-hidden bg-[var(--theme-surface)]/90 backdrop-blur-sm rounded-2xl flex items-center border border-[var(--theme-border)]/50 shadow-inner px-4 relative z-10">
            <div
              className="text-lg font-bold tracking-wide whitespace-nowrap"
              style={{
                color: "var(--theme-primary, #10b981)",
                display: "inline-block",
                paddingLeft: "100%",
                animation: `marquee ${mosque?.running_text_speed || 20}s linear infinite`,
              }}
            >
              {mosque.running_text}
            </div>
          </div>
        )}
      </main>
    )}

    {/* ── Audio Elements ── */}
    <audio
      ref={audioRef}
      src={mosque?.adzan_url || "/audio/adzan.mp3"}
    />
    <audio
      ref={alarmRef}
      src={mosque?.alarm_url || "/audio/alarm.wav"}
    />

    {/* CSS */}
    <style jsx>{`
      @keyframes marquee {
        0% { transform: translateX(0%); }
        100% { transform: translateX(-100%); }
      }
    `}</style>

    </TVThemeProvider>
  );
}

