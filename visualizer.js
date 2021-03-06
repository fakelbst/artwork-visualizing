(function(global) {
    'use strict';

    var WIDTH = 600;
    var HEIGHT = 600;
    var SMOOTHING = 0.8;
    var FFT_SIZE = 1024;

    function artworkVisualizer() {
        this.analyser = context.createAnalyser();
        this.analyser.connect(context.destination);
        this.analyser.minDecibels = -140;
        this.analyser.maxDecibels = 0;
        
        loadSounds(this, {
            buffer: "03-The-lights-werent-that-bright-but-our-eyes-were-so-tired.mp3"
        });
        this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
        this.times = new Uint8Array(this.analyser.frequencyBinCount);

        this.isPlaying = false;
        this.startTime = 0;
        this.startOffset = 0;
    }
    
    // Toggle playback
    artworkVisualizer.prototype.togglePlayback = function() {
        if (this.isPlaying) {
            // Stop playback
            this.source[this.source.stop ? 'stop': 'noteOff'](0);
            this.startOffset += context.currentTime - this.startTime;
            console.log('paused at', this.startOffset);
        // Save the position of the play head.
        } else {
            this.startTime = context.currentTime;
            console.log('started at', this.startOffset);
            this.source = context.createBufferSource();
            // Connect graph
            this.source.connect(this.analyser);
            this.source.buffer = this.buffer;
            this.source.loop = true;
            // Start playback, but make sure we stay in bound of the buffer.
            this.source[this.source.start ? 'start' : 'noteOn'](0, this.startOffset % this.buffer.duration);
            // Start visualizer.
            requestAnimFrame(this.draw.bind(this));
        }
        this.isPlaying = !this.isPlaying;
    }


    artworkVisualizer.prototype.draw = function() {
        this.analyser.smoothingTimeConstant = SMOOTHING;
        this.analyser.fftSize = FFT_SIZE;

        // Get the frequency data from the currently playing music
        this.analyser.getByteFrequencyData(this.freqs);
        this.analyser.getByteTimeDomainData(this.times);

        var width = Math.floor(1/this.freqs.length, 10);

        var canvas = document.querySelector('canvas');
        var drawContext = canvas.getContext('2d');
        var image = new Image();
        image.src = 'artwork.jpg';
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        drawContext.globalAlpha = 0.3;
        drawContext.drawImage(image, 0, 0, WIDTH, HEIGHT);
        drawContext.globalAlpha = 0.9;

        // Draw the frequency domain chart.
        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
            var value = this.freqs[i];
            var percent = value / 256;
            var height = HEIGHT * percent;
            var offset = HEIGHT - height - 1;
            var barWidth = WIDTH/this.analyser.frequencyBinCount;
            drawContext.drawImage(image, i*barWidth, image.height-height, barWidth, height, i*barWidth, offset, barWidth, height);
        }

        if (this.isPlaying) {
            requestAnimFrame(this.draw.bind(this));
        }
    }

    global.artworkVisualizer = artworkVisualizer;
})(window);
