import { Mail, MessageCircle, Building2, Phone, ArrowRight } from "lucide-react";

const CONTACTS = [
  {
    icon: MessageCircle,
    title: "WhatsApp",
    desc: "Respon cepat via chat",
    label: "Chat Sekarang",
    href: "https://wa.me/6289656009717?text=Halo%2C+saya+ingin+bertanya+tentang+SmartMasjid",
    color: "bg-green-50 border-green-200 hover:border-green-400 text-green-700",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    icon: Building2,
    title: "Daftarkan Masjid",
    desc: "Mulai dalam 5 menit",
    label: "Daftar Gratis",
    href: "/register",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-700",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Phone,
    title: "Telepon",
    desc: "+62 896-5600-9717",
    label: "Hubungi",
    href: "tel:+6289656009717",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
];

export default function Contact() {
  return (
    <section className="bg-white py-16 sm:py-20" id="kontak">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Mail className="w-3.5 h-3.5" /> Kontak
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Ada Pertanyaan?</h2>
          <p className="text-gray-500 max-w-md mx-auto">Tim kami siap membantu Anda mendaftarkan masjid, mengatasi kendala teknis, atau menjawab pertanyaan apapun.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {CONTACTS.map(({ icon: Icon, title, desc, label, href, color, iconBg, iconColor }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all hover:shadow-md group ${color}`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="font-bold text-gray-900 mb-1">{title}</div>
              <div className="text-sm text-gray-500 mb-4">{desc}</div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                {label} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
