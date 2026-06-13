import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

interface GridLine {
  x?: number;
  y?: number;
  opacity: number;
  speed: number;
  isVertical: boolean;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const gridLinesRef = useRef<GridLine[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init particles
    const colors = ['#6366f1', '#8b5cf6', '#a78bfa', '#06b6d4', '#0ea5e9'];
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    // Init grid lines
    const numVLines = 12;
    const numHLines = 8;
    gridLinesRef.current = [
      ...Array.from({ length: numVLines }, (_, i) => ({
        x: (canvas.width / numVLines) * i,
        opacity: Math.random() * 0.06 + 0.02,
        speed: (Math.random() + 0.2) * 0.3,
        isVertical: true,
      })),
      ...Array.from({ length: numHLines }, (_, i) => ({
        y: (canvas.height / numHLines) * i,
        opacity: Math.random() * 0.06 + 0.02,
        speed: (Math.random() + 0.2) * 0.3,
        isVertical: false,
      })),
    ];

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouse);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
      gridLinesRef.current.forEach(line => {
        ctx.strokeStyle = `rgba(99, 102, 241, ${line.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        if (line.isVertical && line.x !== undefined) {
          ctx.moveTo(line.x, 0);
          ctx.lineTo(line.x, canvas.height);
        } else if (!line.isVertical && line.y !== undefined) {
          ctx.moveTo(0, line.y);
          ctx.lineTo(canvas.width, line.y);
        }
        ctx.stroke();
      });

      // Update & draw particles
      particlesRef.current.forEach(p => {
        // Mouse repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx += (dx / dist) * 0.03;
          p.vy += (dy / dist) * 0.03;
        }

        // Velocity damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw glow particle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        gradient.addColorStop(0, p.color.replace(')', `, ${p.opacity})`).replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + 'cc';
        ctx.fill();
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
