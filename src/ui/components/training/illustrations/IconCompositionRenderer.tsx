import { useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';

interface IconDefinition {
  name: string;
  size: number;
  position: { x: number; y: number };
  opacity: number;
}

interface IconCompositionData {
  icons: IconDefinition[];
  layout: string;
  backgroundColor: string;
  gradientColors: string[];
}

interface IconCompositionRendererProps {
  data: IconCompositionData;
  className?: string;
}

export function IconCompositionRenderer({
  data,
  className = ''
}: IconCompositionRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.min(width * 0.5, 400) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, data.gradientColors[0] + '20');
    gradient.addColorStop(1, data.gradientColors[1] + '10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = data.gradientColors[0] + '30';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(width * (0.2 + i * 0.15), height * 0.5, 80 + i * 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ height: dimensions.height }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 rounded-xl w-full"
      />
      <div className="absolute inset-0">
        {data.icons.map((icon, idx) => {
          const IconComponent = (LucideIcons as any)[icon.name];
          if (!IconComponent) return null;

          return (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: icon.position.x,
                top: icon.position.y,
                opacity: icon.opacity
              }}
            >
              <IconComponent
                size={icon.size}
                strokeWidth={1.5}
                className="text-white drop-shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
