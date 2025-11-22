import { Cpu, Radio, MapPin } from 'lucide-react';

const features = [
  {
    name: 'Edge Computing',
    description: 'On-device TinyML processing using ESP32 sensors to classify audio in real-time without cloud latency.',
    icon: Cpu,
  },
  {
    name: 'Real-Time Alerts',
    description: 'Instant WebSocket notifications sent to ranger stations the moment a threat is detected.',
    icon: Radio,
  },
  {
    name: 'Geo-Tagging',
    description: 'Precise GPS triangulation allows for rapid and accurate ranger deployment to the incident location.',
    icon: MapPin,
  },
];

export default function Features() {
  return (
    <div className="py-24 bg-background relative" id="technology">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Technology Stack</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-foreground sm:text-4xl">
            Advanced Protection System
          </p>
          <p className="mt-4 max-w-2xl text-xl text-muted-foreground mx-auto">
            A multi-layered approach to environmental security.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root bg-card rounded-lg px-6 pb-8 h-full border border-border hover:border-primary/50 transition-colors duration-300 shadow-sm">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-muted rounded-md shadow-lg border border-border">
                        <feature.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-card-foreground tracking-tight">{feature.name}</h3>
                    <p className="mt-5 text-base text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
