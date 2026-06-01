"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";

import AdminSidebar from "@/components/Adminsidebar";

export default function EventsPage() {

  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const [title, setTitle] =
    useState("");

  const [speaker, setSpeaker] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  const [eventTime, setEventTime] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [events, setEvents] =
    useState<any[]>([]);

  const loadEvents =
    async () => {

      const {
        data,
      } = await supabase

        .from("events")

        .select("*")

        .order(
          "event_date",
          {
            ascending:
              true,
          }
        );

      if (data) {

        setEvents(data);
      }
    };

  useEffect(() => {

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("mosque_id")
          .eq("id", user.id)
          .single();
        if (data) setMosqueId(data.mosque_id);
      }
      await loadEvents();
    };
    init();

    const eventChannel =
      supabase

        .channel(
          "event-realtime"
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "events",
          },
          () => {

            loadEvents();
          }
        )

        .subscribe();

    return () => {

      supabase.removeChannel(
        eventChannel
      );
    };

  }, []);

  const saveEvent =
    async () => {

      if (
        !title ||
        !eventDate ||
        !eventTime
      ) {

        alert(
          "Lengkapi data"
        );

        return;
      }

      await supabase

        .from("events")

        .insert([
          {
            title,

            speaker,

            location,

            event_date:
              eventDate,

            event_time:
              eventTime,

            description,

            mosque_id: mosqueId,
          },
        ]);

      setTitle("");
      setSpeaker("");
      setLocation("");
      setEventDate("");
      setEventTime("");
      setDescription("");

      loadEvents();

      alert(
        "Kegiatan berhasil ditambah"
      );
    };

  const deleteEvent =
    async (id: number) => {

      const confirmDelete =
        confirm(
          "Hapus kegiatan?"
        );

      if (
        !confirmDelete
      ) return;

      await supabase

        .from("events")

        .delete()

        .eq(
          "id",
          id
        );

      loadEvents();
    };

  return (

    <main className="min-h-screen bg-slate-950 text-white flex">

      <AdminSidebar />

      <div className="flex-1 p-6">

        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          <h1 className="text-5xl font-bold text-emerald-400">

            Jadwal Kegiatan

          </h1>

          {/* FORM */}

          <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">

            <h2 className="text-3xl font-bold text-emerald-400">

              Tambah Kegiatan

            </h2>

            <input
              type="text"
              placeholder="Judul Kegiatan"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="text"
              placeholder="Pemateri / Ustadz"
              value={speaker}
              onChange={(e) =>
                setSpeaker(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="text"
              placeholder="Lokasi"
              value={location}
              onChange={(e) =>
                setLocation(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="date"
              value={eventDate}
              onChange={(e) =>
                setEventDate(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="time"
              value={eventTime}
              onChange={(e) =>
                setEventTime(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <textarea
              placeholder="Deskripsi"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              className="bg-slate-800 p-4 rounded-2xl min-h-[120px]"
            />

            <button
              onClick={saveEvent}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
            >

              Simpan Kegiatan

            </button>

          </div>

          {/* LIST */}

          <div className="bg-slate-900 rounded-3xl p-6">

            <h2 className="text-3xl font-bold text-emerald-400 mb-6">

              Jadwal Kegiatan

            </h2>

            <div className="flex flex-col gap-4">

              {events.map(
                (item) => (

                  <div
                    key={item.id}
                    className="bg-slate-800 rounded-2xl p-6 flex items-center justify-between"
                  >

                    <div>

                      <h3 className="text-3xl font-bold">

                        {item.title}

                      </h3>

                      <p className="text-slate-400 mt-2 text-xl">

                        {item.speaker}

                      </p>

                      <p className="text-slate-500 mt-2">

                        {item.location}

                      </p>

                      <p className="text-slate-500 mt-2">

                        {new Date(
                          item.event_date
                        ).toLocaleDateString(
                          "id-ID"
                        )}

                        {" • "}

                        {item.event_time}

                      </p>

                      <p className="text-slate-400 mt-4">

                        {item.description}

                      </p>

                    </div>

                    <button
                      onClick={() =>
                        deleteEvent(
                          item.id
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold"
                    >

                      Delete

                    </button>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}
