import { useEffect, useRef, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  glitchIntensity?: 'low' | 'medium' | 'high';
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

export default function GlitchText({
  text,
  className = '',
  as: Tag = 'span',
  glitchIntensity = 'medium',
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intervals = { low: 80, medium: 50, high: 30 };
  const durations = { low: 400, medium: 600, high: 900 };

  const triggerGlitch = () => {
    setIsGlitching(true);
    let iteration = 0;
    const maxIterations = Math.ceil(durations[glitchIntensity] / intervals[glitchIntensity]);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < iteration) return text[idx];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      iteration += 1 / 3;

      if (iteration >= text.length || Math.random() > 0.7 && iteration > maxIterations / 2) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, intervals[glitchIntensity]);
  };

  useEffect(() => {
    // Auto glitch on mount
    timeoutRef.current = setTimeout(triggerGlitch, 300);

    // Periodic random glitch
    const autoInterval = setInterval(() => {
      if (!isGlitching && Math.random() > 0.7) {
        triggerGlitch();
      }
    }, 4000 + Math.random() * 6000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(autoInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  return (
    <span
      className={`font-mono cursor-default select-none ${className}`}
      onMouseEnter={triggerGlitch}
      style={{ display: Tag === 'span' ? 'inline' : 'block' }}
    >
      {displayText}
    </span>
  );
}
