import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Cpu, Power, Activity, ArrowUpRight, 
  Wrench, Lock
} from 'lucide-react';

const SERVICES = [
  {
    id: "01",
    title: "SIMATIC Automation",
    subtitle: "S7-300, S7-400, S7-1200, S7-1500",
    desc: "Complete lifecycle support for Siemens automation platforms. From legacy migration to TIA Portal integration.",
    icon: Cpu,
  },
  {
    id: "02",
    title: "Industrial Drives & Motors",
    subtitle: "SINAMICS, Micromaster, SIMOTICS",
    desc: "Low voltage converters and motor solutions optimized for precision control and energy efficiency.",
    icon: Power,
  },
  {
    id: "03",
    title: "PROFIBUS / PROFINET",
    subtitle: "Diagnostics & Infrastructure",
    desc: "Advanced network troubleshooting using ComBricks and ProfiTrace. We eliminate communication blind spots.",
    icon: Activity,
  },
  {
    id: "04",
    title: "Component Level Repair",
    subtitle: "IPC, HMI, PLC Modules",
    desc: "Fast-turnaround diagnostic and repair services. Extending the life of obsolete and discontinued parts.",
    icon: Wrench,
  }
];

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = "#admin";
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] font-sans selection:bg-[#0099ff] selection:text-white overflow-x-hidden relative">
      
      {/* Engineered Grid Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ffffff 1px, transparent 1px),
            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      />
      
      {/* Subtle Mouse Follower (Glow) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 153, 255, 0.08), transparent 40%)`
        }}
      />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/10 mix-blend-difference">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0099ff] flex items-center justify-center">
              <span className="font-bold text-black text-lg tracking-tighter">G</span>
            </div>
            <span className="font-bold text-xl tracking-widest text-white uppercase">Gissmatic</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-xs font-mono tracking-widest text-slate-400">
            <a href="#portfolio" className="hover:text-[#0099ff] transition-colors">PORTFOLIO</a>
            <a href="#about" className="hover:text-[#0099ff] transition-colors">EXPERTISE</a>
            <a href="#contact" className="hover:text-[#0099ff] transition-colors">CONTACT</a>
          </div>

          <button 
            onClick={navigateToAdmin}
            className="group flex items-center gap-2 text-xs font-mono tracking-widest text-white hover:text-[#0099ff] transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>PORTAL</span>
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-[90vh] flex flex-col justify-center px-6 pt-20 z-10"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-[#0099ff]"></div>
            <span className="font-mono text-xs tracking-[0.2em] text-[#0099ff] uppercase">Siemens Solution Partner</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[8rem] font-bold tracking-tighter text-white leading-[0.9] mb-8 uppercase">
            Engineering<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
              Continuity.
            </span>
          </h1>
          
          <div className="grid md:grid-cols-2 gap-12 mt-16">
            <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-xl border-l border-white/10 pl-6">
              Specialized in legacy SIMATIC systems, drives, and advanced PROFIBUS/PROFINET diagnostics. We eliminate industrial downtime with surgical precision.
            </p>
            
            <div className="flex flex-col justify-end items-start md:items-end gap-4">
              <a href="#portfolio" className="group flex items-center justify-between w-full md:w-64 px-6 py-4 bg-white text-black font-medium hover:bg-[#0099ff] hover:text-white transition-all duration-300">
                <span>View Portfolio</span>
                <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              </a>
              <div className="font-mono text-xs text-slate-500 text-left md:text-right uppercase tracking-widest mt-2">
                System Integration &bull; Procurement &bull; Repair
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Expertise Statistics (Ticker style) ── */}
      <section className="border-y border-white/10 bg-[#0a0a0a] z-20 relative">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
          <div className="pl-0 md:pl-6">
            <div className="text-4xl font-light text-white mb-2">20<span className="text-[#0099ff]">+</span></div>
            <div className="font-mono text-xs text-slate-500 tracking-widest uppercase">Years Experience</div>
          </div>
          <div className="pl-6 md:pl-8">
            <div className="text-4xl font-light text-white mb-2">HMS</div>
            <div className="font-mono text-xs text-slate-500 tracking-widest uppercase">Authorized Partner</div>
          </div>
          <div className="pl-6 md:pl-8">
            <div className="text-4xl font-light text-white mb-2">12<span className="text-[#0099ff]">mo</span></div>
            <div className="font-mono text-xs text-slate-500 tracking-widest uppercase">Warranty Coverage</div>
          </div>
          <div className="pl-6 md:pl-8">
            <div className="text-4xl font-light text-white mb-2">24/7</div>
            <div className="font-mono text-xs text-slate-500 tracking-widest uppercase">Express Delivery</div>
          </div>
        </div>
      </section>

      {/* ── Services / Portfolio ── */}
      <section id="portfolio" className="py-32 px-6 z-10 relative bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter uppercase">Capabilities</h2>
              <div className="h-[2px] w-24 bg-[#0099ff] mt-6"></div>
            </div>
            <p className="text-slate-400 max-w-md text-sm leading-relaxed">
              From supplying obsolete spare parts to full system migrations. We provide comprehensive lifecycle management for critical infrastructure.
            </p>
          </div>

          <div className="space-y-6">
            {SERVICES.map((srv, idx) => (
              <motion.div 
                key={srv.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative block bg-[#0a0a0a] border border-white/5 hover:border-[#0099ff]/50 transition-colors duration-500"
              >
                <div className="flex flex-col md:flex-row md:items-center p-8 md:p-10 gap-8 md:gap-16">
                  <div className="font-mono text-[#0099ff] text-xl">{srv.id}</div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">{srv.title}</h3>
                    <div className="font-mono text-xs text-[#0099ff] tracking-widest uppercase mb-4">{srv.subtitle}</div>
                    <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">{srv.desc}</p>
                  </div>
                  
                  <div className="hidden md:flex w-16 h-16 border border-white/10 group-hover:border-[#0099ff]/50 items-center justify-center transition-colors">
                    <srv.icon className="w-6 h-6 text-slate-500 group-hover:text-[#0099ff] transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact" className="bg-[#020202] pt-24 pb-12 px-6 border-t border-white/10 z-10 relative">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-white uppercase tracking-tighter mb-8">GISSMATIC</h2>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-8">
              Your trusted partner for SIMATIC automation, component repair, and industrial network diagnostics.
            </p>
            <a href="mailto:sales@gissmatic.com" className="inline-flex items-center gap-2 text-xl font-light text-white hover:text-[#0099ff] transition-colors">
              sales@gissmatic.com
            </a>
          </div>
          
          <div>
            <h4 className="font-mono text-xs tracking-widest text-[#0099ff] uppercase mb-8">Headquarters</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li>26 Sin Ming Lane #03-116</li>
              <li>Midview City</li>
              <li>Singapore 573971</li>
              <li className="pt-4 text-white">+65 6732 0848</li>
              <li className="text-white">+65 9009 1276</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-mono text-xs tracking-widest text-[#0099ff] uppercase mb-8">System</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><button onClick={navigateToAdmin} className="hover:text-white transition-colors flex items-center gap-2"><Lock className="w-3 h-3"/> Staff Login</button></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-600 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Gissmatic Automatisierung Pte Ltd</p>
          <p>Engineered for Precision</p>
        </div>
      </footer>
    </div>
  );
}
