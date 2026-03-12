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
  Mail,
  Facebook,
  Youtube,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STREAM_URL = 'https://uk5freenew.listen2myradio.com/live.mp3?typeportmount=s1_13082_stream_697042847';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(STREAM_URL);
    audioRef.current.volume = volume;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // For live streams, it's often better to reload to get the latest buffer
      audioRef.current.src = STREAM_URL;
      audioRef.current.play().catch(err => console.error("Playback failed:", err));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-radio-green rounded-full flex items-center justify-center text-white shadow-sm">
            <RadioIcon size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-radio-dark">KUKAEW RADIO</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wider">FM 93.00 MHz</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-radio-dark font-semibold border-b-2 border-radio-green pb-1">หน้าแรก</a>
          <a href="#" className="text-gray-500 hover:text-radio-dark transition-colors font-medium">วิทยุสด</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-600">1,254 ผู้ฟัง</span>
          </div>
          <button className="flex items-center gap-2 bg-radio-dark text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            ถ่ายทอดสด
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-radio-green flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-3xl"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card w-full max-w-2xl rounded-[40px] p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10 relative z-10"
        >
          {/* Vinyl Record Player */}
          <div className="relative group">
            {/* Record Sleeve/Base Shadow */}
            <div className="absolute inset-0 bg-black/20 rounded-full blur-2xl transform translate-y-4 scale-90"></div>
            
            <motion.div 
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="relative w-64 h-64 md:w-80 md:h-80 rounded-full shadow-2xl flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle, #333 0%, #111 70%, #000 100%)',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Vinyl Grooves (CSS Pattern) */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'repeating-radial-gradient(circle, transparent, transparent 2px, rgba(255,255,255,0.05) 3px, transparent 4px)',
              }}></div>

              {/* Center Label (Yellow part from the image) */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-[#F2D027] rounded-full flex items-center justify-center border-4 border-black/10 shadow-inner relative z-10">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full overflow-hidden flex items-center justify-center p-2 shadow-sm">
                  <img 
                    src="/src/images/icon-kaew.png" 
                    alt="Station Logo" 
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = "https://uk5freenew.listen2myradio.com/logo.png";
                    }}
                  />
                </div>
                {/* Center Hole */}
                <div className="absolute w-3 h-3 bg-radio-dark rounded-full shadow-inner z-20"></div>
              </div>

              {/* Shine/Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </motion.div>
            
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`absolute bottom-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-30 transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'}`}
            >
              <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
            </button>

            {/* Tonearm (Visual only) */}
            <div className="absolute -top-4 -right-8 w-32 h-40 pointer-events-none hidden md:block">
               <motion.div 
                 animate={{ rotate: isPlaying ? 25 : 0 }}
                 transition={{ duration: 1 }}
                 style={{ transformOrigin: 'top right' }}
                 className="w-full h-full relative"
               >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gray-400 rounded-full shadow-md"></div>
                  <div className="absolute top-4 right-3 w-2 h-32 bg-gray-300 rounded-full origin-top rotate-[15deg] shadow-sm"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-10 bg-gray-500 rounded-sm shadow-sm"></div>
               </motion.div>
            </div>
          </div>

          {/* Player Info & Controls */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-white/70 text-sm font-bold uppercase tracking-widest mb-2 block">กำลังเล่น</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              ฟังเพลงหมอลำสดๆ<br />พร้อมกันที่นี่
            </h2>
            
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-8">
              <span className="text-white/90 text-sm font-medium">ดีเจ จ่าเยี่ยม คนโก้</span>
              <span className="text-white/50 text-xs font-bold uppercase">กำลังจัดรายการ</span>
            </div>

            {/* Progress Bar (Visual only for live stream) */}
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

            {/* Controls */}
            <div className="flex items-center justify-center md:justify-start gap-6">
              <button className="text-white/60 hover:text-white transition-colors">
                <Shuffle size={20} />
              </button>
              <button className="text-white/80 hover:text-white transition-colors">
                <SkipBack size={28} fill="currentColor" />
              </button>
              
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-white text-radio-green rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
              </button>

              <button className="text-white/80 hover:text-white transition-colors">
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button className="text-white/60 hover:text-white transition-colors">
                <Repeat size={20} />
              </button>
            </div>

            {/* Visualizer bars */}
            <div className="mt-10 flex items-end justify-center md:justify-start gap-1 h-8">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: isPlaying ? [8, 24, 12, 32, 16][i % 5] : 4 
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    delay: i * 0.1
                  }}
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
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <RadioIcon size={24} />
              </div>
              <h2 className="font-bold text-2xl">KUKAEW RADIO</h2>
            </div>
            <p className="text-white/60 leading-relaxed max-w-xs">
              นำเสนอเสียงเพลงแห่งจิตวิญญาณอีสานแท้ๆ ทั้งหมอลำ ลูกทุ่ง และบรรยากาศชุมชน ตั้งแต่ปี 1998
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2">ติดต่อเรา</h3>
            <ul className="space-y-4 text-white/70">
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-radio-green" />
                <span>+66 93 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={18} className="text-radio-green" />
                <span>อำเภอกู่แก้ว, จังหวัดอุดรธานี, ประเทศไทย</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-radio-green" />
                <span>hello@kukaewradio.com</span>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg border-b border-white/10 pb-2">ติดตามเรา</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors">
                <Globe size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-radio-green transition-colors">
                <Youtube size={20} />
              </a>
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
    </div>
  );
}
