document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    const reverbMix = document.getElementById('reverbMix');
    const delayTime = document.getElementById('delayTime');
    const distortion = document.getElementById('distortion');
    const playOscillatorButton = document.getElementById('playOscillatorButton');
    const oscFrequency = document.getElementById('oscFrequency');
    const oscType = document.getElementById('oscType');
    const noteDuration = document.getElementById('noteDuration');

    let player;
    let reverb = new Tone.Reverb().toDestination();
    let delay = new Tone.FeedbackDelay().toDestination();
    let dist = new Tone.Distortion().toDestination();
    let oscillator;
    let analyser = new Tone.Analyser('waveform', 1024);

    function createPlayer(url) {
        if (player) {
            player.dispose();
        }
        player = new Tone.Player(url, () => {
            console.log('Sample loaded and ready to play.');
        }).connect(reverb).connect(delay).connect(dist).connect(analyser).toDestination();
    }

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            createPlayer(url);
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
        if (oscillator) {
            oscillator.dispose(); 
        }

        oscillator = new Tone.Oscillator({
            frequency: parseFloat(oscFrequency.value),
            type: oscType.value
        }).connect(reverb).connect(delay).connect(dist).connect(analyser).toDestination();

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
    });

    function drawWaveform() {
        const waveformCanvas = document.getElementById('waveform');
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
