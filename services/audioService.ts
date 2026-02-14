export class AudioService {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;

    constructor() {
        this.preloadSounds();
    }

    private preloadSounds() {
        // Define sound paths - these files need to be added to public/sounds/
        const soundFiles = {
            'pop': './sounds/pop.mp3',
            'sparkle': './sounds/sparkle.mp3',
            'whoosh': './sounds/whoosh.mp3',
            'error': './sounds/error.mp3',
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = 0.5;
            this.sounds.set(key, audio);
        });
    }

    public play(soundName: 'pop' | 'sparkle' | 'whoosh' | 'error') {
        if (this.isMuted) return;

        const audio = this.sounds.get(soundName);
        if (audio) {
            // Reset time to 0 to allow rapid replay
            audio.currentTime = 0;
            audio.play().catch(e => console.warn('Audio play failed:', e));
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    public setVolume(volume: number) {
        this.sounds.forEach(audio => {
            audio.volume = Math.max(0, Math.min(1, volume));
        });
    }
}

export const audioService = new AudioService();
