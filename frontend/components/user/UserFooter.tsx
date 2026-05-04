import { Sparkles, Globe, Share2, PlayCircle, Mail, MapPin, Heart } from 'lucide-react';

type UserFooterProps = {
  isGuest?: boolean;
  onNavigate?: (page: string) => void;
};

export function UserFooter({ isGuest, onNavigate }: UserFooterProps) {
  const year = new Date().getFullYear();

  const navItems = [
    { label: 'Beranda', page: 'home' },
    ...(!isGuest ? [{ label: 'Pesanan Saya', page: 'orders' }] : []),
    ...(!isGuest ? [{ label: 'Toko Saya', page: 'profile' }] : []),
    ...(!isGuest ? [{ label: 'Pesan', page: 'chat' }] : []),
  ];

  const infoItems = [
    { label: 'Donasi', page: 'donation' },
    { label: 'Lisensi', page: 'license' },
    { label: 'Pengaturan', page: 'settings' },
  ];

  const socialLinks = [
    { icon: Globe, label: 'Website', href: '#' },
    { icon: Share2, label: 'Twitter', href: '#' },
    { icon: PlayCircle, label: 'Youtube', href: '#' },
  ];

  const handleClick = (page: string) => {
    if (onNavigate) onNavigate(page);
  };

  return (
    <footer
      className="border-t"
      style={{ borderColor: 'rgba(0,0,0,0.07)', backgroundColor: '#fafafa' }}
    >
      {/* Main footer content */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--theme-primary, #4caf50)', opacity: 0.9 }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-gray-900">RUPA</p>
                <p className="text-xs text-gray-400">Platform Karya Lokal</p>
              </div>
            </div>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-500">
              RUPA adalah ruang bagi para kreator lokal Indonesia untuk menjual karya mereka secara
              personal dan bermakna. Kami percaya setiap karya punya cerita.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 shadow-sm transition-all duration-200 hover:border-transparent hover:text-white hover:shadow-md"
                  style={{
                    ['--hover-bg' as string]: 'var(--theme-primary, #4caf50)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      'var(--theme-primary, #4caf50)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'white';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
                  }}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Navigasi
            </p>
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item.label}>
                  {onNavigate ? (
                    <button
                      onClick={() => handleClick(item.page)}
                      className="text-sm text-gray-500 transition-colors duration-150 hover:text-gray-900"
                      style={{ ['--hover-color' as string]: 'var(--theme-primary)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'var(--theme-primary, #4caf50)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                      }}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">{item.label}</span>
                  )}
                </li>
              ))}
              {isGuest && (
                <li>
                  <button
                    onClick={() => handleClick('profile')}
                    className="text-sm font-medium transition-colors duration-150"
                    style={{ color: 'var(--theme-primary, #4caf50)' }}
                  >
                    Masuk / Daftar
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Info Column */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Lainnya
            </p>
            <ul className="space-y-3">
              {infoItems.map((item) => (
                <li key={item.label}>
                  {onNavigate ? (
                    <button
                      onClick={() => handleClick(item.page)}
                      className="text-sm text-gray-500"
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color =
                          'var(--theme-primary, #4caf50)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                      }}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">{item.label}</span>
                  )}
                </li>
              ))}
              <li>
                <a
                  href="mailto:hello@rupa.id"
                  className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors"
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      'var(--theme-primary, #4caf50)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
                  }}
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@rupa.id
                </a>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Indonesia
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-gray-400 sm:flex-row">
          <p>
            &copy; {year} RUPA. Seluruh hak cipta dilindungi.
          </p>
          <p className="flex items-center gap-1">
            Dibuat dengan <Heart className="h-3 w-3 fill-red-400 text-red-400" /> untuk kreator Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
