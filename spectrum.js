/*
 * Copyright (c) 2019 Jeppe Ledet-Pedersen
 * This software is released under the MIT license.
 * See the LICENSE file for further details.
 */

'use strict';

Spectrum.prototype.squeeze = function(value, out_min, out_max) {
    if (value <= this.min_db)
        return out_min;
    else if (value >= this.max_db)
        return out_max;
    else
        return Math.round((value - this.min_db) / (this.max_db - this.min_db) * out_max);
}

Spectrum.prototype.rowToImageData = function(c, bins) {
    var data = c.createImageData(bins.length, 1);
    for (var i = 0; i < data.data.length; i += 4) {
        var cindex = this.squeeze(bins[i/4], 0, 255);
        var color = this.colormap[cindex];
        data.data[i+0] = color[0];
        data.data[i+1] = color[1];
        data.data[i+2] = color[2];
        data.data[i+3] = 255;
    }
    return data;
}

Spectrum.prototype.addWaterfallRow = function(bins) {
    // Shift waterfall 1 row down
    this.ctx_wf.drawImage(this.ctx_wf.canvas,
        0, 0, this.wf_size, this.wf_rows - 1,
        0, 1, this.wf_size, this.wf_rows - 1);

    // Draw new line on waterfall canvas
    var data = this.rowToImageData(this.ctx_wf, bins);
    this.ctx_wf.putImageData(data, 0, 0);

    var width = this.ctx.canvas.width;
    var height = this.ctx.canvas.height;

    // Copy scaled FFT canvas to screen
    this.ctx.drawImage(this.ctx_wf.canvas,
        0, 0, this.wf_size, this.wf_rows,
        0, this.spectrum_height, width, height - this.spectrum_height);
}

Spectrum.prototype.drawSpectrum = function(bins) {
    var width = this.ctx.canvas.width;
    var height = this.ctx.canvas.height;

    // Clear and fill with black
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, width, this.spectrum_height);

    // Draw grid
    var step = 10;
    for (var i = this.min_db + 10; i <= this.max_db - 10; i += step) {
        this.ctx.beginPath();
        var y = this.spectrum_height - this.squeeze(i, 0, this.spectrum_height);
        this.ctx.moveTo(20, y);
        this.ctx.lineTo(width, y);
        this.ctx.strokeStyle = "rgba(200, 200, 200, 0.10)";
        this.ctx.stroke();
    }

    // Draw axes
    this.ctx.font = "12px Arial";
    this.ctx.fillStyle = "white";
    this.ctx.textBaseline = "middle";
    this.ctx.textAlign = "left";
    var step = 10;
    for (var i = this.min_db + 10; i <= this.max_db - 10; i += step) {
        var y = this.spectrum_height - this.squeeze(i, 0, this.spectrum_height);
        this.ctx.fillText(i, 5, y);
    }

    // Scale for FFT
    this.ctx.save();
    this.ctx.scale(width / this.wf_size, 1);

    // Draw FFT bins
    this.ctx.beginPath();
    this.ctx.moveTo(-1, this.spectrum_height - 1);
    for (var i = 0; i < bins.length; i++) {
        var y = this.spectrum_height - 1 - this.squeeze(bins[i], 0, this.spectrum_height);
        if (y > this.spectrum_height - 1)
            y = this.spectrum_height - 1;
        if (y < 0)
            y = 0;
        if (i == 0)
            this.ctx.lineTo(-1, y);
        this.ctx.lineTo(i, y);
        if (i == bins.length - 1)
            this.ctx.lineTo(this.wf_size + 1, y);
    }
    this.ctx.lineTo(this.wf_size + 1, this.spectrum_height - 1);
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = "#fefefe";
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.fillStyle = this.gradient;
    this.ctx.fill();

    // Restore scale
    this.ctx.restore();
}

Spectrum.prototype.addData = function(data) {
    if (!this.paused) {
        if (data.length != this.wf_size) {
            this.wf_size = data.length;
            this.ctx_wf.canvas.width = data.length;
        }
        this.drawSpectrum(data);
        this.addWaterfallRow(data);
        this.render();
    }
}

Spectrum.prototype.update_spectrum_ratio = function() {
    this.spectrum_height = Math.round(this.canvas.height * this.spectrumPercent / 100.0);

    this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.spectrum_height);
    for (var i = 0; i < this.colormap.length; i++) {
        var c = this.colormap[this.colormap.length - 1 - i];
        this.gradient.addColorStop(i / this.colormap.length,
            "rgba(" + c[0] + "," + c[1] + "," + c[2] + ", 0.5)");
    }
}

Spectrum.prototype.resize = function() {
    var width = this.canvas.clientWidth;
    var height = this.canvas.clientHeight;
    if (this.canvas.width != width ||
        this.canvas.height != height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.update_spectrum_ratio();
    }
}

Spectrum.prototype.render = function() {
    this.resize();
}

Spectrum.prototype.setSpectrumPercent = function(percent) {
    if (percent >= 0 && percent <= 100) {
        this.spectrumPercent = percent;
        this.update_spectrum_ratio();
    }
}

Spectrum.prototype.incrementSpectrumPercent = function() {
    if (this.spectrumPercent + this.spectrumPercentStep <= 100) {
        this.setSpectrumPercent(this.spectrumPercent + this.spectrumPercentStep);
    }
}

Spectrum.prototype.decrementSpectrumPercent = function() {
    if (this.spectrumPercent - this.spectrumPercentStep >= 0) {
        this.setSpectrumPercent(this.spectrumPercent - this.spectrumPercentStep);
    }
}

Spectrum.prototype.toggleColor = function() {
    this.colorindex++;
    if (this.colorindex >= colormaps.length)
        this.colorindex = 0;
    this.colormap = colormaps[this.colorindex];
    this.update_spectrum_ratio();
}

Spectrum.prototype.setRange = function(min_db, max_db) {
    this.min_db = min_db;
    this.max_db = max_db;
}

Spectrum.prototype.rangeUp = function() {
    this.setRange(this.min_db - 5, this.max_db - 5);
}

Spectrum.prototype.rangeDown = function() {
    this.setRange(this.min_db + 5, this.max_db + 5);
}

Spectrum.prototype.rangeDouble = function() {
    this.min_db *= 2; 
}

Spectrum.prototype.rangeHalf = function() {
    this.min_db /= 2; 
}

Spectrum.prototype.setPaused = function(paused) {
    this.paused = paused;
}

Spectrum.prototype.togglePaused = function() {
    this.setPaused(!this.paused);
}

Spectrum.prototype.toggleFullscreen = function() {
    if (!this.fullscreen) {
        if (this.canvas.requestFullscreen) {
            this.canvas.requestFullscreen();
        } else if (this.canvas.mozRequestFullScreen) {
            this.canvas.mozRequestFullScreen();
        } else if (this.canvas.webkitRequestFullscreen) {
            this.canvas.webkitRequestFullscreen();
        } else if (this.canvas.msRequestFullscreen) {
            this.canvas.msRequestFullscreen();
        }
        this.fullscreen = true;
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        this.fullscreen = false;
    }
}

function Spectrum(id, options) {
    // Handle options
    this.wf_size = (options && options.wf_size) ? options.wf_size : 0;
    this.wf_rows = (options && options.wf_rows) ? options.wf_rows : 1024;
    this.spectrumPercent = (options && options.spectrumPercent) ? options.spectrumPercent : 25;
    this.spectrumPercentStep = 5;

    // Setup state
    this.paused = false;
    this.fullscreen = false;
    this.min_db = -100;
    this.max_db = 0;
    this.spectrum_height = 0;

    // Colors
    this.colorindex = 0;
    this.colormap = colormaps[0];

    // Create main canvas and adjust dimensions to match actual
    this.canvas = document.getElementById(id);
    this.canvas.height = this.canvas.clientHeight;
    this.canvas.width = this.canvas.clientWidth;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Create offscreen canvas for waterfall
    this.wf = document.createElement("canvas");
    this.wf.height = this.wf_rows;
    this.wf.width = this.wf_size;
    this.ctx_wf = this.wf.getContext("2d");
    this.ctx_wf.fillStyle = "black";
    this.ctx_wf.fillRect(0, 0, this.ctx_wf.canvas.width, this.ctx_wf.canvas.height);

    // Trigger first render
    this.update_spectrum_ratio();
    this.render();
}
