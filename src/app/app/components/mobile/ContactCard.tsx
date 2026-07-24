import { Phone, MessageCircle, Globe, Mail } from 'lucide-react';

interface ContactCardProps {
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  email?: string | null;
}

export default function ContactCard({ phone, whatsapp, website, email }: ContactCardProps) {
  const hasContact = phone || whatsapp || website || email;
  if (!hasContact) return null;

  return (
    <section className="mx-5 mt-5" aria-label="Kontak Masjid">
      {/* Section header with Islamic ornament */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-purple-400 text-base leading-none" aria-hidden="true">✦</span>
        <h2 className="text-base font-bold" style={{ color: 'var(--pwa-text-primary)' }}>Kontak</h2>
      </div>

      <div
        className="glass-card rounded-3xl overflow-hidden"
        style={{ background: 'var(--pwa-bg-card)', border: '1px solid var(--pwa-border-subtle)' }}
      >
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-4 px-5 py-4 border-b active:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--pwa-border-subtle)' }}
            aria-label={`Telepon ${phone}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 border border-emerald-400/20">
              <Phone size={18} className="text-emerald-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-semibold">Telepon</p>
              <p className="text-base font-medium" style={{ color: 'var(--pwa-text-primary)' }}>{phone}</p>
            </div>
          </a>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 border-b active:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--pwa-border-subtle)' }}
            aria-label={`WhatsApp ${whatsapp}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-green-500/10 border border-green-400/20">
              <MessageCircle size={18} className="text-green-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-green-400 font-semibold">WhatsApp</p>
              <p className="text-base font-medium" style={{ color: 'var(--pwa-text-primary)' }}>{whatsapp}</p>
            </div>
          </a>
        )}
        {website && (
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-5 py-4 border-b active:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--pwa-border-subtle)' }}
            aria-label={`Website ${website}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 border border-blue-400/20">
              <Globe size={18} className="text-blue-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-blue-400 font-semibold">Website</p>
              <p className="text-base font-medium" style={{ color: 'var(--pwa-text-primary)' }}>{website}</p>
            </div>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-4 px-5 py-4 active:opacity-70 transition-opacity"
            aria-label={`Email ${email}`}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10 border border-amber-400/20">
              <Mail size={18} className="text-amber-400" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-amber-400 font-semibold">Email</p>
              <p className="text-base font-medium" style={{ color: 'var(--pwa-text-primary)' }}>{email}</p>
            </div>
          </a>
        )}
      </div>
    </section>
  );
}
