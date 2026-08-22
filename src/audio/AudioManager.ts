import { soundRepository } from "../repositories/soundRepository";

type AudioFinishStatus = 'completed' | 'canceled';

class AudioManager {
    private _audio: HTMLAudioElement;
    private _controller: AbortController | null;
    private _objectUrl: string | null;

    private _resolveCurrent: ((value: AudioFinishStatus | PromiseLike<AudioFinishStatus>) => void) | undefined;

    constructor() {
        this._audio = new Audio();
        this._controller = null;
        this._objectUrl = null;

        this._audio.addEventListener('ended', () => {
            this._resolveCurrent?.('completed');
        });
    }

    public async play(text: string): Promise<AudioFinishStatus> {
        // Stop current playback
        this.stop();

        // Cancel previous fetch
        this._controller?.abort();
        this._controller = new AbortController();

        const response = await soundRepository.narrate(text, this._controller.signal);
        this._objectUrl = URL.createObjectURL(await response);
        this._audio.src = this._objectUrl;

        console.log('--- play', text);
        await this._audio.play();

        return new Promise((resolve) => {
            this._resolveCurrent = (value) => {
                this._resolveCurrent = undefined; // Cleared before subscriber
                resolve(value);
            };
        })
    }

    public pause(): void {
        this._audio.pause();
    }

    public resume(): void {
        this._audio.play();
    }

    public stop(): void {
        this._audio.pause();
        this._audio.currentTime = 0;

        if (this._objectUrl) {
            URL.revokeObjectURL(this._objectUrl);
            this._objectUrl = null;
        }

        this._resolveCurrent?.('canceled');
    }
}

export const audioManager = new AudioManager();