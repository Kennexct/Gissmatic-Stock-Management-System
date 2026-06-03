import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, ShieldCheck, Zap, Settings, 
  Wrench, Activity, Clock, MapPin, Phone, Mail, 
  ChevronRight, Lock
} from 'lucide-react';

const SERVICES = [
  {
    icon: Settings,
    title: "Automation Portfolio",
    desc: "Comprehensive SIEMENS automation systems from legacy to latest innovative platforms.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: Activity,
    title: "PROFIBUS / PROFINET",
    desc: "Best-in-class troubleshooting and maintenance tools from HMS (Atlas, ComBricks, ProfiTrace).",
    color: "from-emerald-500 to-green-400"
  },
  {
    icon: Wrench,
    title: "Expert Repair",
    desc: "Extensive diagnostic and repair services minimizing your operational downtime.",
    color: "from-orange-500 to-amber-400"
  },
  {
    icon: Zap,
    title: "System Upgrade",
    desc: "Seamless migration and modernization of obsolete industrial control systems.",
    color: "from-indigo-500 to-blue-500"
  }
];

const FEATURES = [
  { icon: ShieldCheck, title: "Authorized Partner", desc: "Original products from Siemens & HMS with 12 months warranty." },
  { icon: Clock, title: "20 Years Experience", desc: "In-depth technical consultation and proven market knowledge." },
  { icon: Zap, title: "Fast Delivery", desc: "Large local stock and express delivery for critical breakdowns." }
];

export function LandingPage() {
  const navigateToAdmin = () => {
    window.location.hash = "#admin";
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-[#16c60c] selection:text-white font-sans overflow-x-hidden">
      
      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#0a1565] to-[#1229b3] shadow-lg shadow-blue-900/20">
              <span className="font-bold text-white text-xl tracking-tighter">G</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">GISSMATIC</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-white transition-colors">About Us</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          <button 
            onClick={navigateToAdmin}
            className="group relative px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 text-sm font-medium text-white"
          >
            <Lock className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            Staff Portal
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#1229b3] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#16c60c] rounded-full mix-blend-screen filter blur-[150px] opacity-10" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-white/5 border border-white/10 text-[#16c60c] text-sm font-semibold tracking-wide mb-6">
              YOUR EXPERT FOR SIMATIC
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-8"
          >
            Industrial Automation <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#16c60c] to-emerald-400">
              Evolved.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed mb-10"
          >
            Focusing on SIEMENS automation and drives from legacy to the latest innovative systems. 
            Providing best-in-class PROFIBUS & PROFINET troubleshooting tools from HMS.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a href="#services" className="px-8 py-4 rounded-full bg-gradient-to-r from-[#0a1565] to-[#1229b3] text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-900/30 transition-all hover:scale-105 active:scale-95">
              Explore Portfolio <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#contact" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
              Contact Sales
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Features / Why Us ── */}
      <section id="about" className="py-20 border-y border-white/5 bg-[#0f172a]/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Gissmatic</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Combining decades of expertise with an authorized global network to deliver unparalleled industrial solutions.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0a1565]/50 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feat.icon className="w-7 h-7 text-[#16c60c]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section id="services" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Products & Services</h2>
              <p className="text-slate-400 text-lg max-w-xl">Comprehensive lifecycle management for your critical industrial infrastructure.</p>
            </div>
            <button className="text-[#16c60c] font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              View full catalog <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {SERVICES.map((srv, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-white/10 p-8 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                  <ChevronRight className="w-6 h-6 text-slate-300" />
                </div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${srv.color} flex items-center justify-center mb-8 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <srv.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{srv.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed max-w-md">{srv.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer / Contact ── */}
      <footer id="contact" className="bg-[#020617] border-t border-white/10 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#0a1565] to-[#1229b3]">
                <span className="font-bold text-white tracking-tighter">G</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">GISSMATIC</span>
            </div>
            <p className="text-slate-400 max-w-sm">
              Your trusted expert for SIMATIC systems. Providing comprehensive automation portfolios and troubleshooting solutions.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin className="w-5 h-5 shrink-0 text-[#16c60c]" />
                <span>26 Sin Ming Lane #03-116<br/>Midview City<br/>Singapore 573971</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone className="w-5 h-5 shrink-0 text-[#16c60c]" />
                <span>+65 6732 0848 / 9009 1276</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail className="w-5 h-5 shrink-0 text-[#16c60c]" />
                <a href="mailto:sales@gissmatic.com" className="hover:text-white transition-colors">sales@gissmatic.com</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="#about" className="hover:text-[#16c60c] transition-colors">About Us</a></li>
              <li><a href="#services" className="hover:text-[#16c60c] transition-colors">Automation Portfolio</a></li>
              <li><a href="#services" className="hover:text-[#16c60c] transition-colors">Profibus / Profinet</a></li>
              <li><button onClick={navigateToAdmin} className="hover:text-white flex items-center gap-1.5 transition-colors mt-4"><Lock className="w-3 h-3"/> Staff Portal</button></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} by Gissmatic Automatisierung Pte Ltd.</p>
          <p>Designed for Performance.</p>
        </div>
      </footer>
    </div>
  );
}
