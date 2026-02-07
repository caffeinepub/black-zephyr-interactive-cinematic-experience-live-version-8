import { useEffect, useState } from 'react';
import CinematicScene from './components/CinematicScene';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div
        className={`h-full w-full transition-opacity duration-2000 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CinematicScene />
      </div>
    </div>
  );
}
