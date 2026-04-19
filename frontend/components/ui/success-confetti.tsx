import { useEffect, useState } from 'react';

export function SuccessConfetti() {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 0.5}s`,
      duration: `${2 + Math.random() * 2}s`,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-fall"
          style={{
            left: particle.left,
            backgroundColor: ['#16a34a', '#ea580c', '#f59e0b', '#10b981', '#f472b6'][Math.floor(Math.random() * 5)],
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      ` }} />
    </div>
  );
}
