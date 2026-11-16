/**
 * Sound Manager menggunakan Web Audio API murni.
 * Tidak membutuhkan file MP3/WAV eksternal sehingga bisa berjalan 100% offline di Chromebook!
 */
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.loadSettings();
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('math_sound_enabled');
        if (saved !== null) {
            this.enabled = saved === 'true';
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('math_sound_enabled', this.enabled.toString());
        return this.enabled;
    }

    // Suara klik tombol lembut
    playClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // Suara jawaban BENAR (kicauan ceria C-E-G-C)
    playCorrect() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const startTime = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const noteStart = startTime + idx * 0.07;
            const noteDuration = 0.12;

            gain.gain.setValueAtTime(0, noteStart);
            gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + noteDuration);
        });
    }

    // Suara jawaban SALAH (lembut, tidak menakut-nakuti anak)
    playWrong() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    // Suara Streak (berturut-turut benar)
    playStreak() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 554.37, 659.25, 880, 1108.73];
        const now = this.ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);

            gain.gain.setValueAtTime(0.2, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.2);
        });
    }

    // Fanfare kemenangan saat kuis selesai dengan nilai bagus!
    playFanfare() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const melody = [
            { f: 523.25, d: 0.12, wait: 0 },
            { f: 523.25, d: 0.12, wait: 0.14 },
            { f: 523.25, d: 0.12, wait: 0.28 },
            { f: 659.25, d: 0.25, wait: 0.42 },
            { f: 587.33, d: 0.12, wait: 0.70 },
            { f: 659.25, d: 0.12, wait: 0.84 },
            { f: 783.99, d: 0.45, wait: 0.98 }
        ];

        const now = this.ctx.currentTime;
        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + note.wait);

            gain.gain.setValueAtTime(0.25, now + note.wait);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.wait + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + note.wait);
            osc.stop(now + note.wait + note.d + 0.05);
        });
    }
}

window.soundEffects = new SoundEffects();
