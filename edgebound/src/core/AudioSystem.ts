export class AudioSystem {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    constructor() {
        // Контекст активируется по первому клику игрока
        const unlock = () => {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    public playJump(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    public playGood(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    public playPerfect(): void {
        if (this.isMuted || !this.ctx) return;
        // Неоновый аккорд из двух гармоник для победного ощущения
        [523.25, 659.25, 1046.5].forEach((freq, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.04);

            gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.35 + i * 0.04);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);

            osc.start(this.ctx!.currentTime + i * 0.04);
            osc.stop(this.ctx!.currentTime + 0.35 + i * 0.04);
        });
    }

    public playFail(): void {
        if (this.isMuted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    public setMuted(muted: boolean): void {
        this.isMuted = muted;
    }
}
