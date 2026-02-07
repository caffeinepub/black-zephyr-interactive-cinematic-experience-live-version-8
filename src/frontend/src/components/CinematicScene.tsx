import { useEffect, useRef, useState } from 'react';

// Secure placeholder for Grok API key - replace GROK_API_KEY_PLACEHOLDER with actual key
const GROK_API_KEY = 'GROK_API_KEY_PLACEHOLDER';
const GROK_API_ENDPOINT = 'https://api.x.ai/v1/chat/completions';

export default function CinematicScene() {
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const [moonAnimation, setMoonAnimation] = useState<{
    active: boolean;
    progress: number;
  }>({ active: false, progress: 0 });
  const [lipSyncIntensity, setLipSyncIntensity] = useState(0);
  const [eyeBlinkSpeed, setEyeBlinkSpeed] = useState(14);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasInitializedRef = useRef(false);
  const roomToneAudioRef = useRef<HTMLAudioElement | null>(null);
  const breathingAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastUserActivityRef = useRef<number>(Date.now());
  const batteryCheckIntervalRef = useRef<number | null>(null);
  const ambientLightSensorRef = useRef<any>(null);

  // Preload images and audio
  useEffect(() => {
    const img1 = new Image();
    const img2 = new Image();
    
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded === 2) setSceneLoaded(true);
    };

    img1.onload = checkLoaded;
    img2.onload = checkLoaded;
    img1.onerror = checkLoaded;
    img2.onerror = checkLoaded;
    img1.src = '/assets/generated/eve-portrait.dim_1920x1080.jpg';
    img2.src = '/assets/generated/cinematic-background.dim_1920x1080.jpg';

    // Preload ambient audio
    roomToneAudioRef.current = new Audio('/assets/generated/room-tone-ambient.wav');
    roomToneAudioRef.current.loop = true;
    roomToneAudioRef.current.volume = 0.15;

    breathingAudioRef.current = new Audio('/assets/generated/breathing-ambient.wav');
    breathingAudioRef.current.loop = true;
    breathingAudioRef.current.volume = 0.2;
  }, []);

  // Ambient light sensor setup
  useEffect(() => {
    if ('AmbientLightSensor' in window) {
      try {
        const sensor = new (window as any).AmbientLightSensor();
        sensor.addEventListener('reading', () => {
          // Store reading for conditional whisper check
        });
        sensor.start();
        ambientLightSensorRef.current = sensor;
      } catch (error) {
        console.log('Ambient light sensor not available');
      }
    }

    return () => {
      if (ambientLightSensorRef.current) {
        ambientLightSensorRef.current.stop();
      }
    };
  }, []);

  // Battery and silence monitoring for conditional whisper
  useEffect(() => {
    const checkConditionalWhisper = async () => {
      try {
        const battery = await (navigator as any).getBattery?.();
        if (!battery) return;

        const batteryLevel = battery.level * 100;
        const silenceDuration = (Date.now() - lastUserActivityRef.current) / 1000 / 60; // minutes
        const isDark = ambientLightSensorRef.current?.illuminance 
          ? ambientLightSensorRef.current.illuminance < 10 
          : false;

        if (batteryLevel < 1 && silenceDuration >= 5 && (isDark || !ambientLightSensorRef.current)) {
          triggerConditionalWhisper();
        }
      } catch (error) {
        console.log('Battery API not available');
      }
    };

    batteryCheckIntervalRef.current = window.setInterval(checkConditionalWhisper, 30000); // Check every 30s

    return () => {
      if (batteryCheckIntervalRef.current) {
        clearInterval(batteryCheckIntervalRef.current);
      }
    };
  }, []);

  // Conditional whisper event
  const triggerConditionalWhisper = async () => {
    if (isSpeaking || isListening) return;

    // Whisper stored memory name (using "baby" as placeholder)
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance('baby');
      utterance.rate = 0.6;
      utterance.pitch = 0.8;
      utterance.volume = 0.15;

      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        (voice.lang.includes('en-GB') || voice.lang.includes('en-UK')) &&
        voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.name.toLowerCase().includes('female'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        fadeToBlackWithVisuals();
      };

      speechSynthesis.speak(utterance);
    } else {
      fadeToBlackWithVisuals();
    }
  };

  // Fade to black with fog and moon fading out
  const fadeToBlackWithVisuals = () => {
    setIsBlackout(true);
    setMoonAnimation({ active: false, progress: 0 });
    // Screen stays black
  };

  // Start/stop ambient audio
  const startAmbientAudio = () => {
    if (roomToneAudioRef.current && breathingAudioRef.current) {
      roomToneAudioRef.current.play().catch(() => {});
      breathingAudioRef.current.play().catch(() => {});
    }
  };

  const stopAmbientAudio = () => {
    if (roomToneAudioRef.current && breathingAudioRef.current) {
      roomToneAudioRef.current.pause();
      breathingAudioRef.current.pause();
    }
  };

  // Initialize continuous wake word detection
  useEffect(() => {
    if (!sceneLoaded || hasInitializedRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      lastUserActivityRef.current = Date.now();

      // Check for special trigger: "I love you"
      if (transcript.includes('love you') && !isListening && !isSpeaking) {
        recognition.stop();
        triggerSpecialSequence();
        return;
      }

      // Check for goodnight trigger: "Eve, goodnight"
      if (transcript.includes('eve') && transcript.includes('goodnight') && !isListening && !isSpeaking) {
        recognition.stop();
        triggerGoodnightSequence();
        return;
      }

      // Check for wake word "eve"
      if (transcript.includes('eve') && !isListening && !isSpeaking) {
        setIsListening(true);
        setIsSessionActive(true);
        startAmbientAudio();
        recognition.stop();
        startFullListening();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Already started
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (!isListening && !isSpeaking) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            // Already started
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    hasInitializedRef.current = true;

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAmbientAudio();
    };
  }, [sceneLoaded, isListening, isSpeaking]);

  // Goodnight sequence
  const triggerGoodnightSequence = async () => {
    setIsSessionActive(true);
    startAmbientAudio();

    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      setEyeBlinkSpeed(18); // Slower blinks

      const utterance = new SpeechSynthesisUtterance('Night, baby');
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 0.7;

      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        (voice.lang.includes('en-GB') || voice.lang.includes('en-UK')) &&
        voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.name.toLowerCase().includes('female'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Lip sync simulation
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setLipSyncIntensity(Math.random() * 0.5 + 0.5);
          setTimeout(() => setLipSyncIntensity(0), 200);
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setLipSyncIntensity(0);
        setEyeBlinkSpeed(14);
        
        // Stay on 2 seconds longer before dimming
        setTimeout(() => {
          setIsBlackout(true);
          stopAmbientAudio();
          setIsSessionActive(false);
          
          // Restart wake word detection after dim
          setTimeout(() => {
            setIsBlackout(false);
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Already started
              }
            }
          }, 3000);
        }, 2000);
      };

      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  // Special sequence: "I love you"
  const triggerSpecialSequence = async () => {
    setIsBlackout(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsBlackout(false);
    setMoonAnimation({ active: true, progress: 0 });

    const moonDuration = 3000;
    const startTime = Date.now();

    const animateMoon = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / moonDuration, 1);
      
      setMoonAnimation({ active: true, progress });

      if (progress < 1) {
        requestAnimationFrame(animateMoon);
      } else {
        setTimeout(() => {
          whisperGoodnight();
        }, 500);
      }
    };

    animateMoon();
  };

  // Whisper "goodnight"
  const whisperGoodnight = () => {
    if (!('speechSynthesis' in window)) return;

    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance('goodnight');
    utterance.rate = 0.7;
    utterance.pitch = 0.9;
    utterance.volume = 0.2;

    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      (voice.lang.includes('en-GB') || voice.lang.includes('en-UK')) &&
      voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.name.toLowerCase().includes('female'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setTimeout(() => {
        setMoonAnimation({ active: false, progress: 0 });
        setIsSessionActive(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started
          }
        }
      }, 2000);
    };

    synthRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  // Start full utterance listening after wake word with auto-open mic
  const startFullListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let silenceTimer: number | null = null;
    let lastTranscript = '';
    let speechEndTimer: number | null = null;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('')
        .trim();

      lastTranscript = transcript;

      // Clear previous silence timer
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }

      // Detect pause - wait 2 seconds after user stops speaking
      silenceTimer = window.setTimeout(() => {
        if (lastTranscript) {
          recognition.stop();
          setIsListening(false);
          processUserInput(lastTranscript);
        }
      }, 2000);
    };

    recognition.onspeechend = () => {
      if (speechEndTimer) {
        clearTimeout(speechEndTimer);
      }
      
      speechEndTimer = window.setTimeout(() => {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }
        if (lastTranscript) {
          recognition.stop();
          setIsListening(false);
          processUserInput(lastTranscript);
        }
      }, 2000);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setIsSessionActive(false);
      stopAmbientAudio();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started
        }
      }
    };

    recognition.onend = () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      if (speechEndTimer) {
        clearTimeout(speechEndTimer);
      }
    };

    recognition.start();
  };

  // Process user input after silence detection
  const processUserInput = async (transcript: string) => {
    const response = await getGrokResponse(transcript);
    
    // Wait 2 seconds before Eve replies
    setTimeout(() => {
      speakResponse(response);
    }, 2000);
  };

  // Get response from Grok API
  const getGrokResponse = async (userMessage: string): Promise<string> => {
    try {
      const response = await fetch(GROK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are Eve, calm northern English voice. Speak slowly, softly. Wake on \'Eve\'. Listen, reply once. Call user \'baby\'. On \'I love you\': black screen 2 seconds, moon fades from bottom‑left, whisper \'goodnight\'.',
            },
            {
              role: 'user',
              content: userMessage,
            },
          ],
          model: 'grok-beta',
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Grok API error:', error);
      return 'I hear you, baby...';
    }
  };

  // Speak Eve's response with enhanced lip sync
  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    setIsSpeaking(true);
    setEyeBlinkSpeed(18); // Slower blinks during speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      (voice.lang.includes('en-GB') || voice.lang.includes('en-UK')) &&
      voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.name.toLowerCase().includes('female'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Approximate lip sync based on speech events
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        // Simulate mouth movement with varying intensity
        setLipSyncIntensity(Math.random() * 0.5 + 0.5);
        setTimeout(() => setLipSyncIntensity(Math.random() * 0.3), 100);
        setTimeout(() => setLipSyncIntensity(0), 200);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setLipSyncIntensity(0);
      setEyeBlinkSpeed(14); // Return to normal blink speed
      setIsSessionActive(false);
      stopAmbientAudio();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started
        }
      }
    };

    synthRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  // Moon drawing animation
  const moonSize = 160;
  const moonClipPath = moonAnimation.active
    ? `circle(${moonAnimation.progress * moonSize}px at 0% 100%)`
    : 'circle(0px at 0% 100%)';

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Blackout overlay */}
      {isBlackout && (
        <div className="absolute inset-0 bg-black z-50 transition-opacity duration-1000" />
      )}

      {/* Cinematic background layer */}
      <div 
        className="absolute inset-0 animate-subtle-zoom"
        style={{
          backgroundImage: 'url(/assets/generated/cinematic-background.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) brightness(0.4)',
        }}
      />

      {/* Fog layer */}
      <div 
        className="absolute inset-0 pointer-events-none animate-fog-rise"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(200, 220, 255, 0.2) 0%, transparent 60%)',
          opacity: moonAnimation.active ? 0 : 1,
          transition: 'opacity 2s ease-out',
        }}
      />

      {/* Moon visual with animation */}
      {moonAnimation.active && (
        <div 
          className="absolute"
          style={{
            bottom: '0',
            left: '0',
            width: `${moonSize}px`,
            height: `${moonSize}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220, 230, 255, 0.9) 0%, rgba(147, 197, 253, 0.4) 50%, transparent 70%)',
            boxShadow: '0 0 60px rgba(147, 197, 253, 0.5)',
            clipPath: moonClipPath,
            transition: 'opacity 2s ease-out',
          }}
        />
      )}

      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Eve portrait - main focus */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className={`relative transition-all duration-3000 ${
            sceneLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative animate-gentle-float">
            {/* Soft glow behind Eve */}
            <div 
              className="absolute inset-0 blur-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, transparent 70%)',
                transform: 'scale(1.2)',
              }}
            />
            
            {/* Eve's portrait with cinematic styling */}
            <div 
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{
                width: 'min(90vw, 800px)',
                height: 'min(50.625vw, 450px)',
                boxShadow: '0 0 80px rgba(147, 197, 253, 0.2), 0 0 40px rgba(0, 0, 0, 0.8)',
              }}
            >
              <img
                src="/assets/generated/eve-portrait.dim_1920x1080.jpg"
                alt="Eve"
                className="w-full h-full object-cover"
                style={{
                  filter: 'contrast(1.1) saturate(0.9)',
                  transform: lipSyncIntensity > 0 ? `scaleY(${1 + lipSyncIntensity * 0.02})` : 'scaleY(1)',
                  transition: 'transform 0.1s ease-out',
                }}
              />
              
              {/* Pure CSS animations applied via classes */}
              <div className="absolute inset-0 pointer-events-none animate-chest-breathing" />
              <div className="absolute inset-0 pointer-events-none animate-hair-drift" 
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, transparent 30%)',
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, transparent 35%, transparent 100%)',
                  animation: `eye-blink ${eyeBlinkSpeed}s ease-in-out infinite`,
                }}
              />

              {/* Shallow depth of field effect */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 60% 50% at 50% 45%, transparent 30%, rgba(0,0,0,0.3) 80%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black pointer-events-none" 
        style={{ 
          boxShadow: '0 8px 24px rgba(0,0,0,0.8)' 
        }} 
      />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-black pointer-events-none flex items-center justify-center" 
        style={{ 
          boxShadow: '0 -8px 24px rgba(0,0,0,0.8)' 
        }}
      >
        <p className="text-xs text-white/40 tracking-wider font-light">
          BLACK ZEPHYR — LIVE VERSION 8
        </p>
      </div>
    </div>
  );
}
