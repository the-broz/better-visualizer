import { defineCustomElement } from 'vue';
import type { App, Ref } from 'vue';
import { ref } from 'vue';
import { createPinia } from "pinia";
import { definePluginContext, useCiderAudio } from '@ciderapp/pluginkit';
import MySettings from "./components/MySettings.vue";
import PluginConfig from './plugin.config';

const pinia = createPinia();

function configureApp(app: App) {
    app.use(pinia);
}

export const CustomElements
    = {
    'settings': defineCustomElement(MySettings, {
        shadowRoot: false,
        configureApp
    }),
}

const { plugin, setupConfig, customElementName } = definePluginContext({
    ...PluginConfig,
    CustomElements,
    setup() {
        for (const [key, value] of Object.entries(CustomElements)) {
            const _key = key as keyof typeof CustomElements;
            customElements.define(customElementName(_key), value)
        }

        this.SettingsElement = customElementName('settings');

        //const cfg = useConfig();

        const audio = useCiderAudio();
        const visualizerData: Ref<Uint8Array | null> = ref(null);
        const isAudioReady: Ref<boolean> = ref(false);
        let analyserNode: AnalyserNode | null = null;

        audio.subscribe('ready', () => {
            isAudioReady.value = true;

            if (audio.context) {
                const audioContext = audio.context;

                if (!analyserNode) {
                    analyserNode = audioContext.createAnalyser();
                    analyserNode.fftSize = 32;
                    const bufferLength = analyserNode.frequencyBinCount;
                    visualizerData.value = new Uint8Array(bufferLength);

                    if (audio.source) {
                        audio.source.connect(analyserNode);
                    }
                }
            }
        });

        const replaceVisualizer = (target: HTMLElement) => {
            if (analyserNode === null) {
                console.warn("Analyser not attached! Attempting to connect!")
                try {
                    const audioContext = audio.context;
                    if (!analyserNode) {
                        analyserNode = audioContext!.createAnalyser();
                        analyserNode.fftSize = 32;
                        const bufferLength = analyserNode.frequencyBinCount;
                        visualizerData.value = new Uint8Array(bufferLength);

                        if (audio.source) {
                            audio.source.connect(analyserNode);
                        }
                    }
                } catch (err) {
                    console.error(err);
                    return
                }
            }
            target.querySelector('.playing-indicator')?.remove();

            const previousVisualizer = document.querySelector('#song-visualizer');
            if (previousVisualizer) {
                previousVisualizer.remove();
            }

            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 100;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.id = 'song-visualizer';
            canvas.style.display = 'block';
            canvas.style.padding = "20%";
            target.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            const renderVisualizer = () => {
                if (!ctx || !visualizerData.value || !analyserNode) return;

                analyserNode.getByteFrequencyData(visualizerData.value);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const totalBins = visualizerData.value.length;
                const segmentSize = Math.floor(totalBins / 6);
                const barWidth = (canvas.width / 6) * 0.8;
                const centerY = canvas.height / 2;
                let x = 0;

                const barOrder = [5, 4, 0, 1, 2, 3];
                const musicKeyColor = getComputedStyle(document.documentElement).getPropertyValue('--musicKeyColor').trim();

                barOrder.forEach(i => {
                    const segmentStart = i * segmentSize;
                    const segmentEnd = (i + 1) * segmentSize;
                    const segmentData = visualizerData.value!.slice(segmentStart, segmentEnd);

                    const averageValue = segmentData.reduce((a, b) => a + b, 0) / segmentData.length;
                    const scaledHeight = Math.log1p(averageValue) * 20;
                    const normalizedHeight = Math.max(10, scaledHeight);

                    ctx.fillStyle = musicKeyColor || `rgb(${averageValue + 100}, 50, 150)`;


                    ctx.beginPath();
                    ctx.roundRect(
                        x,
                        centerY - normalizedHeight / 2,
                        barWidth,
                        normalizedHeight,
                        10
                    );
                    ctx.stroke();
                    ctx.fill()
                    ctx.closePath();

                    x += (canvas.width / 6);
                });

                requestAnimationFrame(renderVisualizer);
            };

            renderVisualizer();
        };

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    const oldElement = document.querySelector('.playing-indicator')?.parentElement;
                    const trackNumberElement = document.querySelector('.playing-indicator')?.parentElement?.parentElement;
                    if (trackNumberElement?.classList.contains('trackNumber')) {
                        replaceVisualizer(trackNumberElement);
                    } else if (oldElement) {
                        replaceVisualizer(oldElement);
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

    },
});

export const cfg = setupConfig({
    visualizerDampening: <number>0.45,
    visualizerColoring: <'cider-red' | 'spectrogram' | 'album-art'>'cider-red',
});

export function useConfig() {
    return cfg.value;
}

export { setupConfig, customElementName };

export default plugin;
