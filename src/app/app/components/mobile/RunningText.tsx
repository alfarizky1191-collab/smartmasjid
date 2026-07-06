"use client";

interface RunningTextProps {
  text: string;
  /** Duration in seconds — same field used by TV Display (running_text_speed). */
  speed?: number;
}

/**
 * Running text marquee — same behavior as TV Display.
 * Uses CSS animation so no JS timer is needed.
 */
export default function RunningText({ text, speed = 20 }: RunningTextProps) {
  if (!text.trim()) return null;

  return (
    <section className="mx-5 mt-5">
      <div className="overflow-hidden bg-slate-900/70 border border-slate-700/40 rounded-2xl py-3 px-0">
        <div
          className="text-sm font-bold text-emerald-400 whitespace-nowrap inline-block"
          style={{
            paddingLeft: "100%",
            animation: `marquee-mobile ${speed}s linear infinite`,
          }}
        >
          ✦ &nbsp; {text} &nbsp; ✦
        </div>
      </div>

      {/* Scoped keyframe — defined once, matches TV Display keyframe name in globals */}
      <style>{`
        @keyframes marquee-mobile {
          0%   { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </section>
  );
}
