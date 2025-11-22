import { Activity, Map, Radio } from 'lucide-react';

export default function Hero() {
  return (
    <div className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Text Content */}
        <div className="flex-1 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-secondary-foreground/10 text-secondary-foreground text-xs font-semibold tracking-wide uppercase mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Operational
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Real-Time Acoustic <br />
            <span className="text-primary">
              Monitoring
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
            Leveraging TinyML and IoT to detect poaching threats before they escalate. 
            Protecting wildlife with military-grade precision.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a href="/dashboard/map" className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors shadow-sm text-center">
              View Live Map
            </a>
            <button className="px-8 py-3 bg-transparent border border-input text-foreground font-semibold rounded hover:bg-muted transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Visual Placeholder / Dashboard Mockup */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="relative rounded-xl bg-card border border-border p-2 shadow-2xl">
            {/* Mockup Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50 rounded-t-lg">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">ECOGUARD_DASHBOARD_V1.0</div>
            </div>
            
            {/* Mockup Content */}
            <div className="p-6 grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="col-span-2 h-32 bg-forest-900/50 rounded border border-forest-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" 
                     style={{backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '10px 10px'}}>
                </div>
                <span className="text-tech-green flex items-center gap-2">
                  <Map className="h-4 w-4" /> Topographic Map View
                </span>
              </div>
              
              <div className="h-24 bg-forest-900/50 rounded border border-forest-700 p-3">
                <div className="text-gray-500 mb-2">Signal Strength</div>
                <div className="flex items-end gap-1 h-10">
                  <div className="w-2 h-4 bg-tech-green/30"></div>
                  <div className="w-2 h-6 bg-tech-green/50"></div>
                  <div className="w-2 h-8 bg-tech-green/80"></div>
                  <div className="w-2 h-6 bg-tech-green"></div>
                </div>
              </div>
              
              <div className="h-24 bg-forest-900/50 rounded border border-forest-700 p-3">
                <div className="text-gray-500 mb-2">Active Sensors</div>
                <div className="text-2xl text-white font-bold">12/15</div>
                <div className="text-tech-green text-[10px]">3 Maintenance Req.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-tech-green/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-forest-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
