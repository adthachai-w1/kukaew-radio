import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart, 
  Shuffle, 
  Repeat, 
  Users, 
  Radio as RadioIcon,
  Phone,
  MapPin,
  Facebook,
  Youtube,
  Globe,
  User,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Wifi,
  X,
  Megaphone,
  Navigation,
  Home,
  ExternalLink,
  Menu,
  ChevronRight
} from 'lucide-react';
import iconKaew from "./images/icon-kaew.png";
import { motion, AnimatePresence } from 'motion/react';
import COVER_IMAGE_URL from "./images/photo-1.png";

const STREAM_URL = "https://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_820118366";
const UNLOCK_URL = "https://fm93kukeawradio.radio12345.com/";
const LAT = 17.170219;
const LNG = 103.160999;
const MAPS_EMBED = `https://maps.google.com/maps?q=${LAT},${LNG}&z=15&output=embed`;
const MAPS_LINK = `https://www.google.com/maps?q=${LAT},${LNG}`;

type Page = 'home' | 'contact';

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [showUnlockFrame, setShowUnlockFrame] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [unlockLoaded, setUnlockLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intentionalStopRef = useRef(false);
  const retryCountRef = useRef(0);
  const stallTimerRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRIES = 3;
  const STALL_WAIT_MS = 8000;
  const LOAD_TIMEOUT_MS = 45000;

  const loadStream = () => {
    if (!audioRef.current) return;
    audioRef.current.src = `${STREAM_URL}&t=${Date.now()}`;
    audioRef.current.load();
  };

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const showFailureModal = () => {
    setIsPlaying(false);
    setIsLoading(false);
    setShowSimModal(true);
  };

  const handleStall = () => {
    if (intentionalStopRef.current) return;
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      if (!audioRef.current || intentionalStopRef.current) return;
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        loadStream();
        audioRef.current.play().catch(() => {});
      } else {
        showFailureModal();
      }
    }, STALL_WAIT_MS);
  };

  const handleError = () => {
    if (intentionalStopRef.current) return;
    if (!audioRef.current?.src || audioRef.current.src === window.location.href) return;
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++;
      setTimeout(() => {
        if (intentionalStopRef.current) return;
        loadStream();
        audioRef.current?.play().catch(() => {});
      }, 2000);
    } else {
      showFailureModal();
    }
  };

  const handleCanPlay = () => {
    clearStallTimer();
    retryCountRef.current = 0;
    setIsLoading(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  };

  const handlePlaying = () => {
    clearStallTimer();
    retryCountRef.current = 0;
    setIsLoading(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const consent = localStorage.getItem('kukaew_cookie_consent');
    if (!consent) setShowCookieConsent(true);
    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      clearStallTimer();
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      intentionalStopRef.current = true;
      clearStallTimer();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      setIsPlaying(false);
      setIsLoading(false);
      retryCountRef.current = 0;
      setTimeout(() => { intentionalStopRef.current = false; }, 500);
    } else {
      intentionalStopRef.current = false;
      retryCountRef.current = 0;
      setIsLoading(true);
      setShowClosedModal(false);
      setShowSimModal(false);

      if (!unlockLoaded) {
        await new Promise(res => setTimeout(res, 3000));
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (!audioRef.current || audioRef.current.paused) {
          showFailureModal();
        }
      }, LOAD_TIMEOUT_MS);

      loadStream();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') {
            showFailureModal();
          }
        });
    }
  };

  const retryAfterUnlock = () => {
    setShowSimModal(false);
    setShowUnlockFrame(false);
    retryCountRef.current = 0;
    setTimeout(() => togglePlay(), 1000);
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  const adjustVolume = (amount: number) => {
    setVolume(prev => {
      const next = Math.min(1, Math.max(0, prev + amount));
      if (next > 0) setIsMuted(false);
      return next;
    });
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('kukaew_cookie_consent', 'accepted');
    setShowCookieConsent(false);
  };

  const navigateTo = (p: Page) => {
    setPage(p);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Hidden iframe */}
      <iframe
        src={UNLOCK_URL}
        title="bg-unlock"
        onLoad={() => setUnlockLoaded(true)}
        sandbox="allow-scripts allow-same-origin"
        style={{ position: 'fixed', top: -9999, left: -9999, width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />

      <audio
        ref={audioRef}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
        onStalled={handleStall}
        onWaiting={handleStall}
        onError={handleError}
        preload="none"
      />

      {/* ─── HEADER ─── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">

        {/* Row 1: Logo + Right controls (always visible) */}
        <div className="px-4 md:px-6 py-3 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-radio-green rounded-full flex items-center justify-center text-white shadow-sm overflow-hidden">
              <img src={iconKaew} alt="Kukaew" className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base leading-tight text-radio-dark">KUKAEW RADIO</h1>
              <p className="text-[9px] md:text-[11px] text-gray-400 font-medium tracking-wider">FM 93.00 MHz</p>
            </div>
          </div>

          {/* Desktop Nav — centered */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            <button onClick={() => navigateTo('home')}
              className={`font-semibold text-sm pb-0.5 transition-colors whitespace-nowrap ${page === 'home' ? 'text-radio-dark border-b-2 border-radio-green' : 'text-gray-500 hover:text-radio-dark'}`}>
              หน้าแรก
            </button>
            <button onClick={() => navigateTo('contact')}
              className={`font-semibold text-sm pb-0.5 transition-colors whitespace-nowrap ${page === 'contact' ? 'text-radio-dark border-b-2 border-radio-green' : 'text-gray-500 hover:text-radio-dark'}`}>
              ติดต่อโฆษณา
            </button>
          </nav>

          {/* Spacer mobile */}
          <div className="flex-1 md:hidden" />

          {/* Right controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              <Users size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">1,254 ผู้ฟัง</span>
            </div>
            <button className="flex items-center gap-1.5 bg-radio-dark text-white px-3 py-2 rounded-full text-xs font-semibold hover:bg-opacity-90 transition-all shadow-md whitespace-nowrap flex-shrink-0">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              ถ่ายทอดสด
            </button>
          </div>
        </div>

        {/* Row 2: Mobile Nav — full width tab bar */}
        <div className="md:hidden flex border-t border-gray-100">
          <button
            onClick={() => navigateTo('home')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors text-center ${page === 'home' ? 'text-radio-green border-b-2 border-radio-green' : 'text-gray-400'}`}>
            หน้าแรก
          </button>
          <button
            onClick={() => navigateTo('contact')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors text-center ${page === 'contact' ? 'text-radio-green border-b-2 border-radio-green' : 'text-gray-400'}`}>
            ติดต่อโฆษณา
          </button>
        </div>

      </header>

      {/* ─── PAGES ─── */}
      <AnimatePresence mode="wait">

        {/* HOME PAGE */}
        {page === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <main className="flex-1 bg-radio-green flex items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card w-full max-w-2xl rounded-[40px] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10"
              >
                <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-[32px] shadow-2xl overflow-hidden border-4 border-white/20">
                  <img src={COVER_IMAGE_URL} alt="DJ Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                  <span className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2 block">กำลังเล่น</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    ฟังเพลงแบบสดๆ<br />พร้อมกันที่นี่
                  </h2>
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-8">
                    <span className="text-[#397D54] text-sm font-medium">ดีเจ จ่าเยี่ยม คนโก้</span>
                    <span className="text-[#397D54] text-xs font-bold uppercase">กำลังจัดรายการ</span>
                  </div>
                  <div className="mb-8">
                    <div className="flex justify-between text-white/60 text-xs font-bold mb-2">
                      <span>03:45</span>
                      <span>05:20</span>
                    </div>
                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden relative">
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-white rounded-full"
                        animate={{ width: isPlaying ? "70%" : "40%" }}
                        transition={{ duration: 1 }}
                      />
                      <div className="absolute top-1/2 left-[70%] -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-radio-green"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-6">
                    <button className="text-white/60 hover:text-white transition-colors"><Shuffle size={20} /></button>
                    <button className="text-white/80 hover:text-white transition-colors"><SkipBack size={28} fill="currentColor" /></button>
                    <button
                      onClick={togglePlay}
                      className="w-16 h-16 bg-white text-radio-green rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all relative"
                    >
                      {isLoading ? (
                        <div className="w-8 h-8 border-4 border-radio-green/30 border-t-radio-green rounded-full animate-spin"></div>
                      ) : isPlaying ? (
                        <Pause size={32} fill="currentColor" />
                      ) : (
                        <Play size={32} fill="currentColor" className="ml-1" />
                      )}
                    </button>
                    <button className="text-white/80 hover:text-white transition-colors"><SkipForward size={28} fill="currentColor" /></button>
                    <button className="text-white/60 hover:text-white transition-colors"><Repeat size={20} /></button>
                  </div>
                  <div className="mt-8 flex items-center justify-center md:justify-start gap-4">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white transition-colors">
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm p-1 rounded-xl">
                      <button onClick={() => adjustVolume(-0.1)} className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <Minus size={16} />
                      </button>
                      <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-white" animate={{ width: isMuted ? "0%" : `${volume * 100}%` }} />
                      </div>
                      <button onClick={() => adjustVolume(0.1)} className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-white/60 text-xs font-bold w-8">
                      {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                    </span>
                  </div>
                  <div className="mt-10 flex items-end justify-center md:justify-start gap-1 h-8">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: isPlaying ? [8, 24, 12, 32, 16][i % 5] : 4 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                        className="w-1.5 bg-white/40 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </main>

            {/* Footer */}
            <footer className="bg-radio-dark text-white p-10 md:p-16">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden">
                      <img src={iconKaew} alt="Kukaew" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    <h2 className="font-bold text-2xl">KUKAEW RADIO</h2>
                  </div>
                  <p className="text-white/60 leading-relaxed max-w-xs">
                    นำเสนอเสียงเพลงแห่งจิตวิญญาณอีสานแท้ๆ ทั้งหมอลำ ลูกทุ่ง และบรรยากาศชุมชน
                  </p>
                </div>
                <div className="space-y-6">
                  <h3 className="font-bold text-lg border-b border-white/10 pb-2">ติดต่อเรา</h3>
                  <ul className="space-y-4 text-white/70">
                    <li className="flex items-center gap-3"><Phone size={18} className="text-radio-green" /><span>0819853404</span></li>
                    <li className="flex items-center gap-3"><MapPin size={18} className="text-radio-green" /><span>อำเภอกู่แก้ว, จังหวัดอุดรธานี, ประเทศไทย</span></li>
                    <li className="flex items-center gap-3"><User size={18} className="text-radio-green" /><span>จ่าเยี่ยม คนโก้</span></li>
                  </ul>
                </div>
                <div className="space-y-6">
                  <h3 className="font-bold text-lg border-b border-white/10 pb-2">ติดตามเรา</h3>
                  <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors"><Facebook size={20} /></a>
                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors"><Globe size={20} /></a>
                    <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors"><Youtube size={20} /></a>
                  </div>
                </div>
              </div>
              <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
                <p>© 2024 กู่แก้ววิทยุ FM 93.00 MHz. สงวนลิขสิทธิ์</p>
                <div className="flex gap-8">
                  <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
                  <a href="#" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}

        {/* CONTACT PAGE */}
        {page === 'contact' && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="flex-1 bg-gray-50 flex flex-col"
          >
            {/* Page Title */}
            <div className="max-w-4xl mx-auto w-full px-4 md:px-6 pt-8">
              <h1 className="text-2xl font-bold text-radio-dark">ติดต่อโฆษณา</h1>
              <p className="text-gray-500 text-sm mt-1">สถานีวิทยุกู่แก้วเรดิโอ FM 93.00 MHz</p>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-10 md:py-14 space-y-8 flex-1">

              {/* Contact Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 bg-radio-green/10 rounded-2xl flex items-center justify-center">
                    <User size={28} className="text-radio-green" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">ผู้จัดการสถานี</p>
                    <p className="text-radio-dark font-bold text-lg">จ่าเยี่ยม คนโก้</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 bg-radio-green/10 rounded-2xl flex items-center justify-center">
                    <Phone size={28} className="text-radio-green" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">เบอร์โทรศัพท์</p>
                    <a href="tel:0819853404" className="text-radio-dark font-bold text-lg hover:text-radio-green transition-colors">
                      081-985-3404
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 bg-radio-green/10 rounded-2xl flex items-center justify-center">
                    <MapPin size={28} className="text-radio-green" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-1">ที่ตั้งสถานี</p>
                    <p className="text-radio-dark font-bold text-base leading-snug">
                      อำเภอกู่แก้ว<br />จังหวัดอุดรธานี
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Map Section */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Map Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-radio-green/10 rounded-xl flex items-center justify-center">
                      <Navigation size={20} className="text-radio-green" />
                    </div>
                    <div>
                      <h3 className="font-bold text-radio-dark text-lg">ตำแหน่งสถานี</h3>
                      <p className="text-gray-400 text-sm">สถานีวิทยุกู่แก้วเรดิโอ · {LAT}, {LNG}</p>
                    </div>
                  </div>
                  <a
                    href={MAPS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-radio-green text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-opacity-90 transition-all shadow-md whitespace-nowrap"
                  >
                    <ExternalLink size={16} />
                    เปิดแผนที่ Google Maps
                  </a>
                </div>

                {/* Map Iframe */}
                <div className="relative w-full h-72 md:h-96">
                  <iframe
                    title="ตำแหน่งสถานีวิทยุกู่แก้วเรดิโอ"
                    src={MAPS_EMBED}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                  {/* Floating label */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2.5 border border-gray-100 pointer-events-none z-10">
                    <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 ring-2 ring-red-200"></div>
                    <span className="text-radio-dark font-bold text-sm whitespace-nowrap">สถานีวิทยุกู่แก้วเรดิโอ</span>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <MapPin size={15} className="text-red-500 flex-shrink-0" />
                    <span>FM 93.00 MHz · อำเภอกู่แก้ว จังหวัดอุดรธานี</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-radio-green font-semibold text-sm hover:underline whitespace-nowrap flex items-center gap-1"
                  >
                    <Navigation size={13} />
                    นำทางมาที่นี่
                  </a>
                </div>
              </motion.div>

              {/* Ad CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-radio-green/5 border border-radio-green/20 rounded-3xl p-6 md:p-8"
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="w-12 h-12 bg-radio-green rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Megaphone size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-radio-dark text-xl mb-2">สนใจลงโฆษณากับเรา?</h3>
                    <p className="text-gray-600 leading-relaxed mb-5">
                      สถานีวิทยุกู่แก้วเรดิโอ FM 93.00 MHz ให้บริการโฆษณาทางวิทยุครอบคลุมพื้นที่อำเภอกู่แก้วและใกล้เคียง
                      ติดต่อสอบถามอัตราค่าโฆษณาและแพ็กเกจพิเศษได้โดยตรง
                    </p>
                    <a
                      href="tel:0819853404"
                      className="inline-flex items-center gap-2 bg-radio-green text-white px-6 py-3 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-md"
                    >
                      <Phone size={18} />
                      โทร 081-985-3404
                    </a>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Footer */}
            <footer className="bg-radio-dark text-white px-6 py-10 mt-4">
              <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
                <p>© 2024 กู่แก้ววิทยุ FM 93.00 MHz. สงวนลิขสิทธิ์</p>
                <div className="flex gap-8">
                  <a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
                  <a href="#" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</a>
                </div>
              </div>
            </footer>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ─── MODALS ─── */}

      <AnimatePresence>
        {showSimModal && !showUnlockFrame && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSimModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi size={40} />
              </div>
              <h3 className="text-2xl font-bold text-radio-dark mb-2">การเชื่อมต่อผิดพลาด</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                หากมีปัญหาการรับสัญญาณวิทยุ<br />
                กรุณาแตะปุ่มด้านล่างเพื่อ<br />
                <span className="font-semibold text-radio-dark">เปิดรับสัญญาณ</span><br />
                แล้วกลับมากด <span className="font-semibold text-radio-green">ลองใหม่</span>
              </p>
              <button
                onClick={() => setShowUnlockFrame(true)}
                className="block w-full bg-blue-500 text-white py-4 rounded-2xl font-bold mb-3 hover:bg-blue-600 transition-all shadow-lg"
              >
                เปิดรับสัญญาณ
              </button>
              <button
                onClick={retryAfterUnlock}
                className="w-full bg-radio-dark text-white py-4 rounded-2xl font-bold mb-3 hover:bg-opacity-90 transition-all shadow-lg"
              >
                ลองใหม่
              </button>
              <button
                onClick={() => { setShowSimModal(false); setShowClosedModal(true); }}
                className="w-full py-3 rounded-2xl font-medium text-gray-400 hover:text-gray-600 transition-all"
              >
                ไม่ใช่สัญญาณ → ดูสาเหตุอื่น
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUnlockFrame && (
          <div className="fixed inset-0 z-[200] flex flex-col">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-10 flex flex-col w-full h-full max-w-2xl mx-auto mt-10 rounded-t-[32px] overflow-hidden bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-3 bg-gray-100 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Wifi size={18} className="text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">ปลดล็อกสัญญาณ</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:block">{UNLOCK_URL}</span>
                  <button
                    onClick={() => setShowUnlockFrame(false)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <iframe src={UNLOCK_URL} className="flex-1 w-full border-none" title="Unlock SIM Stream" />
              <div className="shrink-0 px-5 py-4 bg-white border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowUnlockFrame(false)}
                  className="flex-1 py-3 rounded-2xl font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={retryAfterUnlock}
                  className="flex-1 py-3 rounded-2xl font-bold text-white bg-radio-green hover:bg-opacity-90 transition-all shadow-md"
                >
                  รับสัญญาณแล้ว ลองใหม่
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClosedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowClosedModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative z-10 text-center"
            >
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <RadioIcon size={40} />
              </div>
              <h3 className="text-2xl font-bold text-radio-dark mb-2">ขออภัยในความไม่สะดวก</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                ขณะนี้สถานีอยู่ในช่วงเวลาปิดสถานี<br />กรุณาติดตามรับฟังใหม่อีกครั้งในภายหลัง
              </p>
              <button
                onClick={() => setShowClosedModal(false)}
                className="w-full bg-radio-dark text-white py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
              >
                ตกลง
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCookieConsent && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[110]"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-radio-green/10 text-radio-green rounded-2xl flex items-center justify-center shrink-0">
                  <Globe size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-radio-dark">การใช้คุกกี้ (Cookies)</h4>
                  <p className="text-sm text-gray-500 leading-relaxed mt-1">
                    เราใช้คุกกี้เพื่อเพิ่มประสิทธิภาพและประสบการณ์ที่ดีในการใช้งานเว็บไซต์
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={handleAcceptCookies} className="flex-1 bg-radio-dark text-white py-3 rounded-xl font-bold text-sm hover:bg-opacity-90 transition-all">
                  ยอมรับทั้งหมด
                </button>
                <button onClick={() => setShowCookieConsent(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-100 transition-all">
                  ตั้งค่า
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
