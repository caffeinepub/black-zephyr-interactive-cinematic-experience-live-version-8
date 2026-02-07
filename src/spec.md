# Black Zephyr Interactive Cinematic Experience   Live Version 8

## Overview
Black Zephyr is an interactive cinematic experience featuring a character named Eve. The application presents an immersive scene where users can engage with Eve through voice interaction using real-time AI responses, creating an intimate conversational experience with pure CSS animations, ambient audio, and cinematic behaviors.

## Core Features

### Voice Interaction System
- Continuous listening for the wake word "Eve" using browser's SpeechRecognition API
- No visible microphone controls, buttons, icons, or menus - purely voice-activated interface
- Upon wake word detection, automatically open microphone and maintain open audio channel until silence or stop condition is met
- Send recognized text to Grok AI API for intelligent response generation
- Real-time connection to Grok API at `https://api.x.ai` using Bearer token authentication with user-provided key placeholder
- Use `grok-beta` model with system prompt: "You are Eve, calm northern English voice. Speak slowly, softly. Wake on 'Eve'. Listen, reply once. Call user 'baby'. On 'I love you': black screen 2 seconds, moon fades from bottom‑left, whisper 'goodnight'."
- Send POST requests with recognized transcript to Grok endpoint
- Implement Eve voice stop and silence detection - wait 2 seconds after user stops speaking before generating response
- Render Eve's voice responses using Web Speech Synthesis API with UK female voice closest match
- Voice settings: rate 0.9, pitch 1.1 for soft-spoken, northern English female voice
- Special trigger sequence: When user says "I love you" (case-insensitive), trigger complete blackout for 2 seconds
- After blackout, animate moon fade-in from bottom-left corner
- After moon fully appears, Eve whispers "goodnight" at lowest TTS volume
- New goodnight sequence: When user says "Eve, goodnight", Eve replies "Night, baby" gently, screen stays on 2 seconds longer before dimming
- No persistent memory or user identification - reset between sessions

### Ambient Audio System
- Implement ambient background sounds with faint room tone and soft breathing audio
- Layer ambient sounds beneath Eve's voice during active conversation state
- Trigger ambient audio assets only during active voice interaction state
- Loop ambient audio seamlessly while conversation is active
- Fade out ambient sounds when conversation ends

### Enhanced Animation System
- Chest breathing animation using CSS keyframes with 6-second cycle for soft rise and fall movement
- Hair drift animation using CSS keyframes with 10-second left-to-right loop cycle
- Eye blink animation with random intervals between 12-15 seconds using CSS animations
- Enhanced eye blinking: slower blinks during speech pauses
- Lip sync animation: approximate mouth shapes based on speech amplitude and timing
- Subtle lip-sync motion tied to speech events during Eve's responses
- All animations implemented using pure CSS without external libraries or heavy JavaScript
- Seamless animation blending between idle, breathing, and reaction states
- Performance optimized for mobile and desktop browsers
- Maintain cinematic subtlety throughout experience

### Conditional Whisper Event
- Monitor device battery level, user silence duration, and ambient light (if available via ambientLight sensor API)
- Trigger whisper event when: battery < 1%, user silent ≥ 5 minutes, and darkness detected
- During whisper event: softly whisper stored memory name once
- After whisper: fade screen to black with fog and moon visuals fading out

### Cinematic Experience
- Maintain existing visual effects including fog, portrait styling, and vignette
- Graceful fade-in transition on application launch
- Continuous atmospheric ambience with enhanced ambient audio
- "Dream you can't touch" aesthetic through visual styling
- Complete blackout sequence capability
- Fade effects for dramatic moments
- Moon fade animation from bottom-left corner
- Enhanced dimming sequence for goodnight interactions

## Technical Requirements

### Frontend
- Implement SpeechRecognition API for wake word detection, auto-mic opening, and silence detection
- Integrate Web Speech Synthesis API for Eve's voice responses including whisper effects
- Handle real-time Grok API calls with Bearer token authentication using user-provided key placeholder
- Manage pure CSS animation systems for chest breathing (6s cycle), hair drift (10s loop), eye blinking (12-15s intervals), enhanced lip-sync during speech, and slower eye blinks during pauses
- Implement ambient audio playback with room tone and breathing sounds during active state
- Monitor device battery level, user silence duration, and ambient light sensor (if available)
- Implement conditional whisper event with screen fade and visual effects
- Apply all cinematic visual effects including blackout, fade, and enhanced dimming capabilities
- Remove all UI elements, buttons, icons, and menus
- No external animation libraries or heavy JavaScript dependencies

### Backend
- Store and provide Grok API configuration including endpoint URL `https://api.x.ai` and secure placeholder for user-provided authentication token
- Serve existing cinematic background and portrait assets
- Provide ambient audio assets for room tone and breathing sounds
- Handle API proxy requests to Grok AI service if needed for CORS compliance

## Content Language
All content and audio will be in English.
