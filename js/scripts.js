document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const sampleVolume = document.getElementById('sampleVolume'); 
    const reverbMix = document.getElementById('reverbMix');
    const delayTime = document.getElementById('delayTime');
    const distortion = document.getElementById('distortion');
    const playOscillatorButton = document.getElementById('playOscillatorButton');
    const oscFrequency = document.getElementById('oscFrequency');
    const oscType = document.getElementById('oscType');
    const noteDuration = document.getElementById('noteDuration');
    const oscillatorVolume = document.getElementById('oscillatorVolume');
    const waveformCanvas = document.getElementById('waveform');
    const status = document.getElementById('status');
    
    // Tone.js setup
    let player;
    let reverb = new Tone.Reverb().toDestination();
    let delay = new Tone.FeedbackDelay().toDestination();
    let dist = new Tone.Distortion().toDestination();
    let analyser = new Tone.Analyser('waveform', 1024);
    let oscillator;
    
    // MusicVAE setup
    const mvae = new music_vae.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small');
    const magentaPlayer = new core.Player();
    let generatedSample = null;

    const synth = new Tone.Synth().connect(reverb).connect(delay).connect(dist).connect(analyser).toDestination();
    
    mvae.initialize().then(() => {
        status.textContent = 'Status: Ready to generate music.';
    });

    document.getElementById('generateBtn').addEventListener('click', async () => {
        status.textContent = 'Status: Generating music...';

        try {
            const samples = await mvae.sample(1);
            generatedSample = samples[0]; 

            document.getElementById('playBtn').disabled = false;
            status.textContent = 'Status: Music generated! Click play to listen.';
        } catch (error) {
            console.error("Error generating music: ", error);
            status.textContent = 'Status: Error generating music.';
        }
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        if (generatedSample) {
            status.textContent = 'Status: Playing music...';
            playGeneratedMusic();
        }
    });

    playButton.addEventListener('click', () => {
        if (player) {
            Tone.start().then(() => {
                player.start();
                console.log('Playing sample...');
                drawWaveform();
            });
        } else {
            console.log('No sample loaded.');
        }
    });

    stopButton.addEventListener('click', () => {
        if (player) {
            player.stop();
            console.log('Sample stopped.');
        } else {
            console.log('No sample loaded.');
        }
    });

    sampleVolume.addEventListener('input', (event) => {
        const volume = event.target.value;
        if (player) {
            player.volume.value = volume * 30 - 30; 
        }
    });

    reverbMix.addEventListener('input', () => {
        reverb.decay = parseFloat(reverbMix.value) * 10;
    });

    delayTime.addEventListener('input', () => {
        delay.delayTime.value = parseFloat(delayTime.value);
    });

    distortion.addEventListener('input', () => {
        dist.distortion = parseFloat(distortion.value) * 100;
    });

    playOscillatorButton.addEventListener('click', () => {
        if (oscillator) oscillator.dispose();
        playOscillator();
    });

    oscillatorVolume.addEventListener('input', (event) => {
        if (oscillator) {
            oscillator.volume.value = event.target.value * 30 - 30; 
        }
    });

    const midiVolume = document.getElementById('midiVolume');
    midiVolume.addEventListener('input', (event) => {
        const volume = event.target.value;  
        const volumeInDb = volume * 30 - 30;  
        
        if (synth) {
            synth.volume.value = volumeInDb;  
        }

        document.getElementById('midiVolumeLabel').textContent = `Volume: ${(volume * 100).toFixed(0)}%`;
    });

    function createPlayer(url) {
        if (player) player.dispose();
        player = new Tone.Player(url, () => console.log('Sample loaded and ready to play.'))
            .connect(reverb).connect(delay).connect(dist).connect(analyser).toDestination();
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            createPlayer(url);
        }
    });

    function playGeneratedMusic() {
        magentaPlayer.start(generatedSample).then(() => {
            const midiEvents = generatedSample.notes;
            midiEvents.forEach(note => {
                synth.triggerAttackRelease(note.pitch, note.endTime - note.startTime, note.startTime);
            });
            status.textContent = 'Status: Music playback finished.';
        }).catch(error => {
            console.error("Error playing music: ", error);
            status.textContent = 'Status: Error during playback.';
        });
    }

    function playOscillator() {
        oscillator = new Tone.Oscillator({
            frequency: parseFloat(oscFrequency.value),
            type: oscType.value
        }).connect(reverb).connect(delay).connect(dist).connect(analyser).toDestination();

        oscillator.volume.value = oscillatorVolume.value * 30 - 30;  

        Tone.start().then(() => {
            oscillator.start();
            console.log('Playing oscillator...');

            const duration = parseFloat(noteDuration.value);
            setTimeout(() => {
                oscillator.stop();
                console.log('Oscillator stopped.');
            }, duration * 1000);

            drawWaveform();
        });
    }

    function drawWaveform() {
        const canvasCtx = waveformCanvas.getContext('2d');

        function render() {
            requestAnimationFrame(render);

            const buffer = analyser.getValue();
            const width = waveformCanvas.width;
            const height = waveformCanvas.height;
            canvasCtx.clearRect(0, 0, width, height);

            canvasCtx.beginPath();
            canvasCtx.strokeStyle = '#fff';
            canvasCtx.lineWidth = 2;

            const sliceWidth = width * 1.0 / buffer.length;
            let x = 0;
            for (let i = 0; i < buffer.length; i++) {
                const v = buffer[i] * 0.5 + 0.5;
                const y = v * height;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }
            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();
        }

        render();
    }
});
