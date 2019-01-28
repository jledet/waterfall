'use strict';

function keypress(e, spectrum) {
    if (e.key == " ") {
        spectrum.togglePaused();
    } else if (e.key == "f") {
        spectrum.toggleFullscreen();
    } else if (e.key == "c") {
        spectrum.toggleColor();
    } else if (e.key == "ArrowUp") {
        spectrum.rangeUp();
    } else if (e.key == "ArrowDown") {
        spectrum.rangeDown();
    } else if (e.key == "ArrowLeft") {
        spectrum.rangeHalf();
    } else if (e.key == "ArrowRight") {
        spectrum.rangeDouble();
    } else if (e.key == "s") {
        spectrum.incrementSpectrumPercent();
    } else if (e.key == "w") {
        spectrum.decrementSpectrumPercent();
    } 
}

function main() {
    // Create spectrum object on canvas with ID "waterfall"
    var spectrum = new Spectrum(
        "waterfall", {
            spectrumPercent: 20
    });

    // Bind keypress handler
    window.addEventListener("keydown", function (e) {
        keypress(e, spectrum);
    });

    // Connect to websocket
    var ws = new WebSocket("ws://" + window.location.host + "/websocket");
    ws.onopen = function(evt) {
        console.log("connected!");
    }
    ws.onclose = function(evt) {
        console.log("closed");
    }
    ws.onmessage = function (evt) {
        var data = JSON.parse(evt.data);
        if (data.s) {
            spectrum.addData(data.s);
        } else {
            if (data.center) {
                spectrum.setCenterHz(data.center);
            }
            if (data.span) {
                spectrum.setSpanHz(data.span);
            }
        }
    }
    ws.onerror = function(evt) {
        console.log("error: " + evt);
    }
}

window.onload = main;
