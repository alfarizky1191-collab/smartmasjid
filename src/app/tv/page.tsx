"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function TVPage() {

  // =========================
  // MOSQUE ID FROM URL
  // =========================

  const [mosqueId, setMosqueId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMosqueId(params.get("mosque_id"));
  }, []);

  // =========================
  // STATES
  // =========================

  const [time, setTime] =
    useState("");

  const [mosque, setMosque] =
    useState<any>(null);

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
  latestDonations,
  setLatestDonations,
] = useState<any[]>([]);

const [
  popupDonation,
  setPopupDonation,
] = useState<any>(null);

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

  const donationPopupTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

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

    const today =
      new Date()

        .toISOString()

        .split("T")[0];

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
      const today = new Date().toISOString().split("T")[0];
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

    const loadDonations =
      async () => {

        const {
          data,
        } = await supabase

          .from(
            "donations"
          )

          .select("*")

          .eq("mosque_id", mosqueId)

          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )

          .limit(5);

        if (data) {

          setLatestDonations(
            data
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

          await loadQris();

          await loadDonations();

          await loadEvents();

          await loadTodayOfficers();

          // MOSQUE
          const {
            data:
              mosqueData,
          } = await supabase

            .from("mosques")

            .select("*")

            .eq("id", mosqueId)

            .single();

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

            // CACHE
            localStorage.setItem(
              "mosque",
              JSON.stringify(
                mosqueItem
              )
            );

            // PRAYER API
            const response =
              await fetch(

                `https://api.aladhan.com/v1/timingsByCity?city=${mosqueItem.city || "Bandung"}&country=Indonesia&method=11`

              );

            const result =
              await response.json();

            setPrayerTimes(
              result.data.timings
            );

            localStorage.setItem(
              "prayerTimes",
              JSON.stringify(
                result.data.timings
              )
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

        } catch {

          // CACHE FALLBACK
          const cachedMosque =
            localStorage.getItem(
              "mosque"
            );

          const cachedPrayer =
            localStorage.getItem(
              "prayerTimes"
            );

          if (cachedMosque) {

            setMosque(
              JSON.parse(
                cachedMosque
              )
            );
          }

          if (cachedPrayer) {

            setPrayerTimes(
              JSON.parse(
                cachedPrayer
              )
            );
          }
        }
      };

    fetchData();

    // =========================
    // REALTIME MOSQUE
    // =========================

    const mosqueChannel =
      supabase

        .channel(
          "mosque-realtime"
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
          "announcement-realtime"
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
    // REALTIME DONATION
    // =========================

    const donationChannel =
      supabase

        .channel(
          "donation-realtime"
        )

        .on(
          "postgres_changes",
          {
            event:
              "INSERT",
            schema:
              "public",
            table:
              "donations",
            filter:
              `mosque_id=eq.${mosqueId}`,
          },
          (payload) => {

            loadDonations();

            setPopupDonation(
              payload.new
            );

            if (
              donationPopupTimeoutRef.current
            ) {

              clearTimeout(
                donationPopupTimeoutRef.current
              );
            }

            donationPopupTimeoutRef.current =
              setTimeout(() => {

                setPopupDonation(
                  null
                );

                donationPopupTimeoutRef.current =
                  null;

              }, 10000);
          }
        )

        .subscribe();

    // =========================
    // REALTIME EVENT
    // =========================

    const eventChannel =
      supabase

        .channel(
          "event-realtime"
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
      .channel("officer-realtime")
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
        donationChannel
      );

      supabase.removeChannel(
        eventChannel
      );

      supabase.removeChannel(
        officerChannel
      );

      if (
        donationPopupTimeoutRef.current
      ) {

        clearTimeout(
          donationPopupTimeoutRef.current
        );
      }
    };

  }, [mosqueId]);

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

          if (!mosque?.city)
            return;

          const response =
            await fetch(

              `https://api.aladhan.com/v1/timingsByCity?city=${mosque.city}&country=Indonesia&method=11`

            );

          const result =
            await response.json();

          setPrayerTimes(
            result.data.timings
          );
        }

      }, 60000);

    return () =>
      clearInterval(
        interval
      );

  }, [mosque]);

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
              "/audio/adzan-subuh.mp3",
          },

          {
            name:
              "Dzuhur",
            time:
              prayerTimes.Dhuhr,
            audio:
              "/audio/adzan.mp3",
          },

          {
            name:
              "Ashar",
            time:
              prayerTimes.Asr,
            audio:
              "/audio/adzan.mp3",
          },

          {
            name:
              "Maghrib",
            time:
              prayerTimes.Maghrib,
            audio:
              "/audio/adzan.mp3",
          },

          {
            name:
              "Isya",
            time:
              prayerTimes.Isha,
            audio:
              "/audio/adzan.mp3",
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

  if (!mosqueId) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-2xl">
        Mosque ID tidak ditemukan. Gunakan /tv?mosque_id=ID
      </main>
    );
  }

  return (

    <main className={`

      min-h-screen
      p-6
      flex
      flex-col
      gap-6
      overflow-hidden
      transition-all
      duration-500

      ${showAdzan
        ? "bg-yellow-950 text-white"
        : "bg-black text-white"}

    `}>

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-6">

          {mosque?.logo_url && (

            <img
              src={
                mosque.logo_url
              }
              alt="Logo"
              className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400 bg-white"
            />

          )}

          <div>

            <h1 className="text-6xl font-bold text-emerald-400">

              {mosque?.name}

            </h1>

            <p className="text-3xl text-slate-300 mt-2">

              {mosque?.city}

            </p>

          </div>

        </div>

        <div className="flex items-center gap-4">

          <button
            onClick={
              goFullscreen
            }
            className="bg-emerald-500 px-8 py-4 rounded-2xl text-black font-bold text-2xl"
          >
            Fullscreen
          </button>
<button
  onClick={() => {

    if (
      audioRef.current
    ) {

      audioRef.current.volume =
        0.8;

      audioRef.current.play();
    }
  }}
  className="bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold"
>

  Test Adzan

</button>

<button
  onClick={() => {

    if (
      alarmRef.current
    ) {

      alarmRef.current.volume =
        0.8;

      alarmRef.current.play();
    }
  }}
  className="bg-yellow-500 text-black px-6 py-4 rounded-2xl font-bold"
>

  Test Alarm

</button>
          <button
            onClick={() =>
              setAutoAdzanEnabled(
                !autoAdzanEnabled
              )
            }
            className="bg-emerald-500 px-8 py-4 rounded-2xl text-black font-bold text-2xl"
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
      <div className={`

        rounded-3xl
        p-8
        text-center
        transition-all
        duration-500

        ${showAdzan
          ? "bg-yellow-400 text-black animate-pulse"
          : "bg-emerald-500 text-black"}

      `}>

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

        {prayers.map(
          (item) => (

            
            <div
            
              key={item.name}
              className="bg-slate-900 rounded-3xl p-6 text-center"
            >

              <h2 className="text-3xl font-bold text-emerald-400">

                {item.name}

              </h2>

              <p className="text-5xl font-bold mt-6">

                {item.time}

              </p>

            </div>
            
          )
        )}

      </div>

{/* SLIDER */}
<div className="bg-slate-900 rounded-3xl overflow-hidden h-[350px] relative mb-6">

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

  <div className="bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center gap-6">

    <h2 className="text-5xl font-bold text-emerald-400">

      Donasi Masjid

    </h2>

    <img
      src={qrisUrl}
      alt="QRIS"
      className="w-[350px] rounded-3xl border-4 border-emerald-400"
    />

    <p className="text-3xl text-white text-center">

      Scan QRIS untuk infaq & donasi masjid

    </p>
<div className="bg-slate-900 rounded-3xl p-6">

  <h2 className="text-4xl font-bold text-emerald-400 mb-6 text-center">

    Donatur Terbaru

  </h2>

  <div className="flex flex-col gap-4">

    {latestDonations.map(
      (item) => (

        <div
          key={item.id}
          className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between"
        >

          <h3 className="text-2xl font-bold text-white">

            {item.donor_name ||
              "Hamba Allah"}

          </h3>

          <p className="text-3xl font-bold text-emerald-400">

            Rp {item.amount.toLocaleString("id-ID")}

          </p>

        </div>
      )
    )}

  </div>

</div>
  </div>

)}
</div>

      {/* PETUGAS HARI INI */}
      <div className="bg-slate-900 rounded-3xl p-6">
        <h2 className="text-4xl font-bold text-emerald-400 mb-6 text-center">
          Petugas Hari Ini
        </h2>
        {todayOfficers.length === 0 ? (
          <p className="text-2xl text-slate-400 text-center">Belum ada jadwal petugas hari ini</p>
        ) : (
          <div className="flex flex-col gap-3">
            {todayOfficers.map((o, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-800 rounded-2xl px-6 py-4">
                <span className="text-2xl font-semibold text-yellow-400 capitalize">{o.role}</span>
                <span className="text-2xl text-white">{o.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-3xl p-6">

        <h2 className="text-4xl font-bold text-emerald-400 mb-6 text-center">

          Jadwal Kegiatan

        </h2>

        <div className="flex flex-col gap-4">

          {events.map(
            (item) => (

              <div
                key={item.id}
                className="bg-slate-800 rounded-2xl p-4"
              >

                <h3 className="text-3xl font-bold text-white">

                  {item.title}

                </h3>

                <p className="text-xl text-slate-300 mt-2">

                  {item.speaker}

                </p>

                <p className="text-slate-400 mt-2">

                  {new Date(
                    item.event_date
                  ).toLocaleDateString(
                    "id-ID"
                  )}

                  {" • "}

                  {item.event_time}

                </p>

              </div>
            )
          )}

        </div>

      </div>
      {/* PENGUMUMAN */}
      <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4 flex-1 overflow-hidden">

        <h2 className="text-4xl font-bold text-emerald-400">
          Pengumuman
        </h2>

        {announcements.map(
          (item) => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-2xl p-6"
            >

              <p className="text-4xl text-center font-bold">

                {item.title}

              </p>

            </div>
          )
        )}

      </div>

      {/* RUNNING TEXT */}
     <div className="w-full overflow-hidden bg-slate-900 rounded-3xl py-4">

  <div
    className="text-4xl font-bold text-emerald-400 whitespace-nowrap"
    style={{
      display: "inline-block",
      minWidth: "100%",
      paddingLeft: "100%",
      animation: `marquee ${
        mosque?.running_text_speed || 20
      }s linear infinite`,
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
  src="audio/adzan.mp3"
/>

<audio
  ref={alarmRef}
  src="audio/alarm.wav"
/>

{popupDonation && (

  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

    <div className="bg-slate-900 border-4 border-emerald-400 rounded-[40px] p-12 flex flex-col items-center gap-6 animate-pulse">

      <h2 className="text-6xl font-bold text-emerald-400 text-center">

        Terima Kasih 🙏

      </h2>

      <h3 className="text-5xl font-bold text-white text-center">

        {popupDonation.donor_name ||
          "Hamba Allah"}

      </h3>

      <p className="text-6xl font-bold text-yellow-400">

        Rp {popupDonation.amount.toLocaleString("id-ID")}

      </p>

      <p className="text-2xl text-slate-300 text-center">

        Semoga menjadi amal jariyah 🤲

      </p>

    </div>

  </div>

)}
    </main>
  );
}
  
