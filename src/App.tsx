import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Flame, 
  Sparkles, 
  Share2, 
  Bell, 
  CheckCircle, 
  ArrowRight, 
  Compass, 
  Shield, 
  Tag, 
  Smartphone, 
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

// Default static parameters for Stay22 integration
const AFFILIATE_TOKEN = 'stay22_c7ab2bf0-8b8c-47c0-bbe1-2d4cb9ba2bb2';

interface CuratedCategory {
  name: string;
  tagline: string;
  emoji: string;
}

interface HotDeal {
  title: string;
  description: string;
  discountLabel: string;
}

interface AdvertisingInfo {
  title: string;
  tagline: string;
  description: string;
  buttonText: string;
}

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  moodName: string;
}

interface PersonalizedData {
  headline: string;
  pitch: string;
  categories: CuratedCategory[];
  hotDeal: HotDeal;
  advertising: AdvertisingInfo;
  theme: ThemeConfig;
}

interface TrendItem {
  keyword: string;
  tag: string;
  headline: string;
  description: string;
  popularity: number;
  discount: string;
  image: string;
  defaultPreferences: string;
}

export default function App() {
  // Input Form States
  const [destination, setDestination] = useState('Cancún');
  const [dates, setDates] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState('2');
  const [preferences, setPreferences] = useState('Relajación y confort premium');
  const [trendKeyword, setTrendKeyword] = useState('Escape de verano caribeño');

  // App configurations and dynamic states
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [personalized, setPersonalized] = useState<PersonalizedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertForm, setAlertForm] = useState({ email: '', phone: '' });
  const [alertMsg, setAlertMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Suggested popular destinations
  const popularDestinations = [
    'Cancún',
    'Oaxaca de Juárez',
    'Los Cabos',
    'Valle de Guadalupe',
    'CDMX',
    'Playa del Carmen',
    'San Miguel de Allende'
  ];

  // Load trends on startup
  useEffect(() => {
    fetch('/api/trends')
      .then(res => res.json())
      .then(data => setTrends(data))
      .catch(err => console.error('Error fetching trends:', err));

    // Initial personalization with default settings
    triggerPersonalization('Cancún', 'Relajación y confort premium', 'Escape de verano caribeño');
    
    // Set default dates to 7 days from now (default checkin/checkout)
    const today = new Date();
    const futureCheckin = new Date(today);
    futureCheckin.setDate(today.getDate() + 10);
    const futureCheckout = new Date(today);
    futureCheckout.setDate(today.getDate() + 14);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const checkinStr = `${futureCheckin.getFullYear()}-${pad(futureCheckin.getMonth()+1)}-${pad(futureCheckin.getDate())}`;
    const checkoutStr = `${futureCheckout.getFullYear()}-${pad(futureCheckout.getMonth()+1)}-${pad(futureCheckout.getDate())}`;
    
    setCheckin(checkinStr);
    setCheckout(checkoutStr);
    setDates(`Del ${futureCheckin.getDate()} de Julio al ${futureCheckout.getDate()} de Julio, 2026`);
  }, []);

  // Update human readable dates representation when calendar picker inputs change
  useEffect(() => {
    if (checkin && checkout) {
      const d1 = new Date(checkin);
      const d2 = new Date(checkout);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      setDates(`Del ${d1.toLocaleDateString('es-MX', options)} al ${d2.toLocaleDateString('es-MX', options)}`);
    }
  }, [checkin, checkout]);

  // Handle Dynamic Gemini Personalization (Transforms page visual + copy)
  const triggerPersonalization = async (dest: string, prefs: string, keyword: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: dest,
          dates,
          preferences: prefs,
          trendKeyword: keyword
        })
      });
      const data = await response.json();
      setPersonalized(data);
    } catch (err) {
      console.error('Error personalizing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit search and update AI personalization
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerPersonalization(destination, preferences, `Búsqueda manual: ${destination}`);
  };

  // Click a daily trend to instantly fill inputs and personalize visual theme
  const selectTrend = (trend: TrendItem) => {
    setDestination(trend.keyword);
    setPreferences(trend.defaultPreferences);
    setTrendKeyword(trend.headline);
    triggerPersonalization(trend.keyword, trend.defaultPreferences, trend.headline);
    
    // Scroll to booking search section
    const bookingElement = document.getElementById('buscador-section');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Submit Price Alert (Intent Flywheel)
  const handlePriceAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/price-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: alertForm.email,
          phone: alertForm.phone,
          destination,
          checkin,
          checkout
        })
      });
      const data = await response.json();
      if (data.success) {
        setAlertSubmitted(true);
        setAlertMsg(data.details);
      }
    } catch (err) {
      console.error('Error submitting price alert:', err);
    }
  };

  // Viral WhatsApp Share link generator
  const getShareLink = () => {
    const currentUrl = window.location.href;
    const text = `¡Mira los hoteles y tarifas reales que encontré para nuestro viaje a ${destination}! 🏖️✨ Reservas con confirmación inmediata: ${currentUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Copy link to clipboard
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Create Stay22 Embed URL
  const getStay22Url = () => {
    // Basic formatting for embedding Stay22
    const encodedAddress = encodeURIComponent(destination);
    let url = `https://www.stay22.com/embed/gm?aid=${AFFILIATE_TOKEN}&address=${encodedAddress}&guests=${guests}`;
    if (checkin) url += `&checkin=${checkin}`;
    if (checkout) url += `&checkout=${checkout}`;
    
    // Accent styling conversion if personalized theme is active
    if (personalized?.theme?.primary) {
      const rawHex = personalized.theme.primary.replace('#', '');
      url += `&maincolor=${rawHex}`;
    }
    
    return url;
  };

  const activeTheme = personalized?.theme || {
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#0284c7',
    moodName: 'Slate Nocturno Premium'
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 transition-colors duration-500 font-sans border-4 sm:border-8 border-stone-200">
      
      {/* Top micro-banner / Dynamic Trend Signal Indicator */}
      <div className="bg-stone-900 text-stone-100 py-2.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-stone-800">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <p className="font-mono text-[10px] uppercase tracking-widest text-stone-300">
            Nova AI Active Flow: <span className="text-orange-400 font-serif italic font-bold">Optimizing Conversions</span>
          </p>
        </div>
        <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-stone-400">Referral ID:</span>
          <span className="text-orange-400 font-mono underline select-all">c7ab2bf0-8b8c-47c0-bbe1-2d4cb9ba2bb2</span>
          <span className="hidden md:inline text-stone-400">|</span>
          <span className="hidden md:inline text-stone-300">Temporada Verano 2026</span>
        </div>
      </div>

      {/* Header / Editorial Branding */}
      <header className="h-24 bg-white border-b border-stone-200 sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-full flex items-center justify-between">
          <div className="flex items-baseline space-x-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic text-stone-950 font-sans">
              Hoteles Reales<span className="text-orange-600">.MX</span>
            </h1>
            <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 bg-black text-white font-bold rounded-sm uppercase tracking-widest">
              Powered by Stay22
            </span>
          </div>

          <nav className="hidden md:flex space-x-8 text-xs font-bold uppercase tracking-widest text-stone-600">
            <a href="#buscador-section" className="border-b-2 border-orange-600 pb-1 text-stone-950">Buscador</a>
            <a href="#tendencias-section" className="hover:text-orange-600 transition-colors">Tendencias</a>
            <a href="#DMC-concierge" className="hover:text-orange-600 transition-colors">VIP Concierge</a>
            <a href="#alertas-precio" className="hover:text-orange-600 transition-colors">Alertas de Tarifa</a>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right leading-none hidden sm:block">
              <p className="text-[9px] text-stone-400 font-bold uppercase">Señal de Intención</p>
              <p className="text-xs font-black text-orange-600">ALTA (MÉXICO / LATAM)</p>
            </div>
            <a 
              href="#buscador-section"
              className="bg-black hover:bg-orange-600 text-white transition-colors px-5 py-2.5 text-xs font-black uppercase tracking-wider italic border border-black hover:border-orange-600"
            >
              Buscar Estancia
            </a>
          </div>
        </div>
      </header>

      {/* Hero Showcase with Neurowriting Visuals */}
      <section className="relative bg-white border-b border-stone-200 py-12 lg:py-20 overflow-hidden">
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Persuasive copy section */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center space-x-2 bg-stone-100 border border-stone-200 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-[10px] font-bold text-stone-700 uppercase tracking-widest font-mono">
                  Tema Visual: {activeTheme.moodName || 'Oasis Editorial'}
                </span>
              </div>

              {/* Serifized Majestic Headline */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black italic tracking-tight text-stone-950 leading-tight">
                {personalized?.headline || `Tu estancia perfecta en ${destination} seleccionada a mano`}
              </h2>

              {/* Subtitle / Pitch */}
              <p className="text-base sm:text-lg text-stone-600 font-serif italic leading-relaxed max-w-2xl border-l-2 border-stone-300 pl-4">
                {personalized?.pitch || 'Curaduría exclusiva adaptada a tus deseos. Reserva en tiempo real con las mejores tarifas garantizadas del mercado.'}
              </p>

              {/* Horizontal features bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                {(personalized?.categories || [
                  { name: 'Ubicación Premium', tagline: 'Hoteles en el centro de la acción.', emoji: '📍' },
                  { name: 'Curaduría Experta', tagline: 'Selección boutique garantizada.', emoji: '✨' },
                  { name: 'Mejor Tarifa', tagline: 'Precios Stay22 al segundo.', emoji: '💵' }
                ]).map((cat, idx) => (
                  <div 
                    key={idx} 
                    className="bg-stone-50 border border-stone-200 p-4 hover:border-black transition-all group"
                  >
                    <div className="text-xl mb-1">{cat.emoji}</div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-stone-950 group-hover:text-orange-600 transition-colors">{cat.name}</h4>
                    <p className="text-[11px] text-stone-500 mt-1 leading-normal font-serif italic">{cat.tagline}</p>
                  </div>
                ))}
              </div>

              {/* Hot Recommended Deal Banner */}
              {personalized?.hotDeal && (
                <div className="mt-6 border-2 border-black p-5 bg-stone-50 relative">
                  <div className="absolute -top-3 left-4 bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5">
                    Selección Especial de la Red
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pt-1">
                    <h5 className="font-bold text-sm uppercase text-stone-900 tracking-wider">
                      {personalized.hotDeal.title}
                    </h5>
                    <span className="text-[11px] text-orange-600 font-bold flex items-center gap-1 font-mono uppercase bg-orange-50 px-2 py-0.5 border border-orange-200">
                      <Flame className="h-3 w-3 fill-current" /> {personalized.hotDeal.discountLabel}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed font-serif italic">{personalized.hotDeal.description}</p>
                </div>
              )}

            </div>

            {/* Trends Section - Interactive bento card */}
            <div id="tendencias-section" className="lg:col-span-5">
              <div className="bg-stone-50 border-2 border-stone-900 p-6 shadow-md">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
                  <h3 className="font-black text-sm uppercase tracking-wider text-stone-950 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    Destinos Más Buscados Hoy
                  </h3>
                  <span className="text-[10px] text-stone-500 font-mono font-bold">VERANO 2026</span>
                </div>

                <p className="text-xs text-stone-500 mb-4 font-serif italic leading-relaxed">
                  Las búsquedas de alojamiento han aumentado un 140% esta semana. Haz clic para transformar el portal en el destino seleccionado:
                </p>

                <div className="space-y-3.5">
                  {(trends.length > 0 ? trends : [
                    { keyword: 'Cancún', tag: 'Playas', headline: 'Paraíso Turquesa', popularity: 98, discount: 'Garantía Stay22' },
                    { keyword: 'Oaxaca de Juárez', tag: 'Cultura', headline: 'Tradición Histórica', popularity: 92, discount: 'Desayuno Gratis' },
                    { keyword: 'Los Cabos', tag: 'Wellness', headline: 'Lujo en el Pacífico', popularity: 89, discount: 'Cancelación Gratis' }
                  ]).map((trend, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectTrend(trend as TrendItem)}
                      className="w-full text-left p-3 border border-stone-200 hover:border-black bg-white hover:bg-stone-50 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-serif italic font-black text-stone-400 text-lg group-hover:text-orange-600 transition-colors">
                          0{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wider text-stone-900 group-hover:text-black">{trend.keyword}</span>
                            <span className="text-[8px] px-1 bg-stone-150 text-stone-500 border border-stone-200 uppercase font-mono font-bold">{trend.tag}</span>
                          </div>
                          <span className="text-xs text-stone-500 font-serif italic">{trend.headline}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-black text-orange-600 font-mono uppercase">{trend.discount}</div>
                        <span className="text-[9px] text-stone-400 font-mono uppercase">Interés: {trend.popularity}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Interactive Booking Finder Frame Section */}
      <section id="buscador-section" className="py-12 max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Dynamic Navigation Form Card with Heavy black outline style */}
        <div className="bg-white border-2 border-stone-900 p-6 md:p-8 relative z-20 shadow-md">
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-orange-600 rounded-none" />
                <h3 className="font-serif font-black italic text-xl text-stone-950">Filtra tu Estancia Inteligente</h3>
              </div>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-3 py-1 border border-stone-200 font-mono font-bold uppercase tracking-wider">
                Stay22 API Partner Code Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Destination Search */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                  <MapPin className="h-3 w-3 text-orange-600" /> Destino o Propiedad
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Escribe una ciudad, región o resort..."
                    className="w-full px-4 py-3 bg-stone-50 hover:bg-stone-100 focus:bg-white border-2 border-stone-200 focus:border-stone-900 rounded-none text-sm transition-all outline-none font-bold"
                    required
                  />
                  <Search className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                </div>
                {/* Popular badges row */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {popularDestinations.slice(0, 5).map((pop) => (
                    <button
                      key={pop}
                      type="button"
                      onClick={() => setDestination(pop)}
                      className={`text-[9px] px-2.5 py-1 font-mono uppercase tracking-wider border font-bold transition-all ${
                        destination.toLowerCase() === pop.toLowerCase()
                          ? 'bg-black border-black text-white'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-400'
                      }`}
                    >
                      {pop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Checkin / Checkout Row */}
              <div className="md:col-span-4 grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-stone-400" /> Llegada
                  </label>
                  <input
                    type="date"
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    className="w-full px-3 py-3 bg-stone-50 hover:bg-stone-100 focus:bg-white border-2 border-stone-200 focus:border-stone-900 rounded-none text-xs transition-all outline-none font-bold text-stone-750"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3 text-stone-400" /> Salida
                  </label>
                  <input
                    type="date"
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    className="w-full px-3 py-3 bg-stone-50 hover:bg-stone-100 focus:bg-white border-2 border-stone-200 focus:border-stone-900 rounded-none text-xs transition-all outline-none font-bold text-stone-750"
                    required
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1 font-mono">
                  <Users className="h-3 w-3 text-stone-400" /> Huéspedes
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-3 py-3.5 bg-stone-50 hover:bg-stone-100 focus:bg-white border-2 border-stone-200 focus:border-stone-900 rounded-none text-xs transition-all outline-none font-bold text-stone-700"
                >
                  <option value="1">1 Viajero</option>
                  <option value="2">2 Viajeros</option>
                  <option value="3">3 Viajeros</option>
                  <option value="4">4 Viajeros</option>
                  <option value="5">Familia (5+)</option>
                </select>
              </div>

              {/* Action Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-black hover:bg-orange-600 transition-colors text-xs font-black text-white uppercase tracking-widest italic border border-black hover:border-orange-600 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" /> Personalizar
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Preference Category Selector */}
            <div className="p-4 bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 flex items-center space-x-3">
                <div className="p-2 bg-stone-200 text-stone-800 rounded-none">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-900">Estilo del Viaje</h4>
                  <p className="text-[10px] text-stone-500 font-serif italic">¿Qué define esta escapada?</p>
                </div>
              </div>
              <div className="md:col-span-8 flex flex-wrap gap-2">
                {[
                  'Relajación y confort premium',
                  'Romance, lujo y privacidad',
                  'Familiar, seguro y divertido',
                  'Cultura local, foodie y arte',
                  'Económico, práctico y céntrico'
                ].map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => {
                      setPreferences(pref);
                      triggerPersonalization(destination, pref, trendKeyword);
                    }}
                    className={`text-xs px-3.5 py-2 font-mono uppercase tracking-wider border font-bold transition-all ${
                      preferences === pref 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Dynamic MAP Widget Frame */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Map Embed wrapper - Branded Frame */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white border-2 border-stone-900 p-4 shadow-sm space-y-3">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-3 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="h-3.5 w-3.5 bg-orange-600 rounded-none" />
                  <h4 className="font-serif font-black italic text-base text-stone-950">
                    Disponibilidad y Tarifas en tiempo real: <span className="text-orange-600 underline">{destination}</span>
                  </h4>
                </div>
                <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-600 px-3 py-0.5 font-bold uppercase tracking-widest font-mono">
                  Stay22 Live Engine Connected
                </span>
              </div>

              {/* The Stay22 Map Iframe inside an elegant thick-bordered card */}
              <div className="relative aspect-video w-full border-2 border-stone-200 overflow-hidden bg-stone-50 min-h-[500px]">
                <iframe
                  src={getStay22Url()}
                  width="100%"
                  height="100%"
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  title={`Stay22 Hotel Map of ${destination}`}
                />
              </div>

              {/* Map Footer Info */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1.5 text-xs text-stone-500 border-t border-stone-100">
                <span className="flex items-center gap-1.5 font-serif italic text-stone-500">
                  <Shield className="h-4 w-4 text-stone-400" />
                  Garantía de cotización segura respaldada por Booking, Expedia, Agoda y Hotels.com.
                </span>
                
                {/* Viral Share Option */}
                <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                  <button
                    onClick={copyLink}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold uppercase tracking-wider text-[10px] border border-stone-300 font-mono"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
                  </button>
                  <a
                    href={getShareLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[10px] font-mono"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Compartir por WhatsApp</span>
                  </a>
                </div>
              </div>

            </div>

            {/* Dynamic Neurowriting Advertising Banner - Monetizes DMC Core services */}
            {personalized?.advertising && (
              <div className="border-2 border-stone-950 bg-stone-900 text-stone-100 p-6 lg:p-8 relative overflow-hidden shadow-sm">
                {/* Abstract corner design to match editorial style */}
                <div className="absolute top-0 right-0 border-t-32 border-r-32 border-t-orange-600 border-r-orange-600" />
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-stone-800 text-orange-400 border border-stone-700 px-3 py-1 font-mono">
                      {personalized.advertising.tagline}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-serif font-black italic">{personalized.advertising.title}</h4>
                    <p className="text-sm text-stone-300 leading-relaxed font-serif italic">
                      {personalized.advertising.description}
                    </p>
                  </div>
                  <div className="md:col-span-4 text-left md:text-right">
                    <button 
                      onClick={() => alert(`¡DMC Concierge Activado para ${destination}! Un asesor experto se contactará contigo para cotizar el traslado premium.`)}
                      className="inline-flex items-center justify-center px-6 py-3.5 rounded-none font-bold text-xs uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 transition-all border border-orange-600 shadow-sm cursor-pointer"
                    >
                      {personalized.advertising.buttonText} <ArrowRight className="h-3.5 w-3.5 ml-2 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Sidebar - Intelligent Price Alert & Information */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Price Drop Intelligent Alert Lead Generator */}
            <div id="alertas-precio" className="bg-white border-2 border-stone-900 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-stone-200">
                <div className="p-2 bg-stone-100 border border-stone-200 text-stone-800">
                  <Bell className="h-5 w-5 text-orange-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-stone-950">Boletín e Alertas de Ofertas</h4>
                  <p className="text-xs text-stone-500 font-serif italic">Monitoreo activo de caídas de precio</p>
                </div>
              </div>

              {!alertSubmitted ? (
                <form onSubmit={handlePriceAlert} className="space-y-4">
                  <p className="text-xs text-stone-600 leading-relaxed font-serif italic">
                    Nuestro motor de monitoreo rastresa las OTAs de Stay22 cada hora. Te avisaremos gratis en cuanto detectemos una baja en <strong className="text-stone-950 underline">{destination}</strong>.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest font-mono">Correo Electrónico</label>
                    <input
                      type="email"
                      value={alertForm.email}
                      onChange={(e) => setAlertForm({ ...alertForm, email: e.target.value })}
                      placeholder="ejemplo@viajes.com"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-none text-sm transition-all outline-none font-bold"
                      required={!alertForm.phone}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-widest font-mono">WhatsApp de Notificación</label>
                    <input
                      type="tel"
                      value={alertForm.phone}
                      onChange={(e) => setAlertForm({ ...alertForm, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-none text-sm transition-all outline-none font-bold"
                      required={!alertForm.email}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-black hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest transition-all italic cursor-pointer"
                  >
                    Activar Alertas de Ofertas
                  </button>

                  <p className="text-[10px] text-stone-400 leading-normal text-center font-serif italic">
                    🔒 Cero spam. Respetamos tu privacidad. Desactivación en un solo clic.
                  </p>
                </form>
              ) : (
                <div className="bg-stone-50 border border-stone-300 p-4 text-center space-y-3">
                  <CheckCircle className="h-8 w-8 text-orange-600 mx-auto" />
                  <h5 className="font-bold text-xs uppercase tracking-wider text-stone-950">¡Alerta Inteligente Activada!</h5>
                  <p className="text-xs text-stone-700 leading-relaxed font-serif italic">
                    {alertMsg}
                  </p>
                  <button
                    onClick={() => setAlertSubmitted(false)}
                    className="text-xs font-mono font-bold text-orange-600 underline hover:text-stone-950"
                  >
                    Crear otra alerta
                  </button>
                </div>
              )}
            </div>

            {/* Why Book with Hoteles Reales (Persuasion Triggers) */}
            <div className="bg-stone-900 text-stone-100 border-2 border-stone-950 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-xs text-orange-400 tracking-widest uppercase flex items-center gap-1.5 font-mono">
                <Shield className="h-4 w-4" /> Garantía de Confianza DMC
              </h4>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 bg-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-stone-200">Sin Cargo por Servicio Oculto</h5>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-serif italic">Mostramos tarifas completas con impuestos incluidos desde el inicio de tu cotización.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 bg-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-stone-200">Alineado a tu Código de Socio</h5>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-serif italic">Toda reserva respalda el ecosistema de viajes de nuestro DMC autorizado.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-1.5 w-1.5 bg-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-stone-200">Atención Local Integrada</h5>
                    <p className="text-[11px] text-stone-400 leading-relaxed font-serif italic">Combina tu hotel con traslados, excursiones privadas y concierge de Destinos Reales DMC.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Live Booking Activity Stream */}
            <div className="bg-white border-2 border-stone-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-[10px] text-stone-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-ping" /> Actividad Reciente
              </h4>
              <div className="space-y-3.5 text-xs">
                <div className="border-b border-stone-150 pb-2.5">
                  <p className="font-bold uppercase tracking-wider text-stone-900 text-[10px]">Familia M. de Guadalajara reservó:</p>
                  <p className="text-stone-500 font-serif italic mt-0.5">Resort Familiar 5★ en Riviera Maya — <span className="font-mono font-bold text-stone-900 text-[10px] uppercase">Stay22 tarifa exclusiva</span></p>
                </div>
                <div className="border-b border-stone-150 pb-2.5">
                  <p className="font-bold uppercase tracking-wider text-stone-900 text-[10px]">Pareja S. de Monterrey cotizó:</p>
                  <p className="text-stone-500 font-serif italic mt-0.5">Hotel Boutique Colonial en Oaxaca Centro Histórico</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-stone-900 text-[10px]">Viajero Individual de CDMX reservó:</p>
                  <p className="text-stone-500 font-serif italic mt-0.5">Viñedo Glamping en Valle de Guadalupe — <span className="font-mono font-bold text-orange-600 text-[10px] uppercase">-15% de ahorro</span></p>
                </div>
              </div>
            </div>

            {/* AD SPACE Placeholder beautifully styled for Editorial theme */}
            <div className="p-4 bg-stone-50 border border-dashed border-stone-300 text-center text-[10px] uppercase font-bold text-stone-400 tracking-widest">
              Anuncio Local / DMC Curated Space
            </div>

          </div>

        </div>

      </section>

      {/* Corporate DMC Branding Footer */}
      <footer id="DMC-concierge" className="bg-stone-950 text-stone-400 py-16 border-t-2 border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Compass className="h-5 w-5 text-orange-500" />
                <span className="text-white font-black text-base uppercase tracking-wider">Hoteles Reales MX</span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed font-serif italic">
                Herramienta premium para agencias y viajeros de alta gama. Integra la potencia de búsqueda de Stay22 con el servicio y concierge físico de Destinos Reales DMC.
              </p>
              <p className="text-[9px] text-stone-500 font-mono">
                Licencia de Afiliado Activo: {AFFILIATE_TOKEN}
              </p>
            </div>

            <div>
              <h4 className="text-stone-200 font-bold text-xs uppercase tracking-widest mb-4 font-mono">Destinos Destacados</h4>
              <ul className="space-y-2.5 text-xs text-stone-400 font-serif italic">
                <li><a href="#buscador-section" onClick={() => { setDestination('Cancún'); triggerPersonalization('Cancún', preferences, 'Cancún Beach'); }} className="hover:text-white transition-colors">Cancún y Riviera Maya</a></li>
                <li><a href="#buscador-section" onClick={() => { setDestination('Oaxaca de Juárez'); triggerPersonalization('Oaxaca de Juárez', preferences, 'Oaxaca Cultural'); }} className="hover:text-white transition-colors">Oaxaca de Juárez</a></li>
                <li><a href="#buscador-section" onClick={() => { setDestination('Los Cabos'); triggerPersonalization('Los Cabos', preferences, 'Cabo Luxury'); }} className="hover:text-white transition-colors">Los Cabos, BCS</a></li>
                <li><a href="#buscador-section" onClick={() => { setDestination('Valle de Guadalupe'); triggerPersonalization('Valle de Guadalupe', preferences, 'Valle Wine'); }} className="hover:text-white transition-colors">Valle de Guadalupe</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-stone-200 font-bold text-xs uppercase tracking-widest mb-4 font-mono">DMC VIP Concierge</h4>
              <ul className="space-y-2 text-xs text-stone-400 font-serif italic">
                <li>Traslados Aeropuerto Privados</li>
                <li>Renta de Yates de Lujo en Cancún</li>
                <li>Catas Privadas en Viñedos</li>
                <li>Coordinación de Eventos / MICE</li>
                <li>Asistencia Local 24/7 en Destino</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-stone-200 font-bold text-xs uppercase tracking-widest mb-4 font-mono font-bold">Contacto DMC</h4>
              <p className="text-xs text-stone-400 leading-relaxed font-serif italic">
                ¿Planeas un viaje grupal o necesitas un itinerario corporativo MICE? Nuestro equipo de expertos locales te guiará.
              </p>
              <div className="pt-2">
                <a
                  href={`mailto:hs33j331@gmail.com?subject=Hoteles%20Reales%20MX%20-%20Consulta%20DMC`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider font-mono transition-all"
                >
                  <span>Contacto Directo DMC</span>
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-stone-850 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Hoteles Reales MX — Powered by Stay22 & Destinos Reales DMC. Todos los derechos reservados.</p>
            <div className="flex space-x-4 mt-4 sm:mt-0 font-mono text-[10px]">
              <span className="hover:text-stone-400 cursor-pointer">Términos</span>
              <span className="hover:text-stone-400 cursor-pointer">Privacidad</span>
              <span className="hover:text-stone-400 cursor-pointer">Afiliados</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
