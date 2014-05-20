/*global window,document,console, $,Terminal */
/*jslint regexp: false*/
$(function () {
    var init = window.location.hash && window.location.hash.substr(1);
    // a plain number is to start a particular frame,
    // a semicolon followed by a number is a multiplier for
    // the initial delay
    mult = (tmp = init.split(';')).length > 1 ? Number(tmp[1]) || 1 : 1;
    if (mult !== 1) window.location.hash = tmp[0];

    Terminal.bindKeys = function () {};
    var timings = window.timingfile.trim().split("\n").map(function (line) {
        return line.split(" ").map(Number);
    }),
        lines = window.scriptfile.trim().split("\n"),
        script = lines.slice(1).join("\n"),
        start = 0,
        position = 0,
        stopped = false,
        paused = false,
        terminal,
        delay = mult * 1000;

    function slower() {
        delay *= 2;
    }

    function faster() {
        delay /= 2;
    }

    function normal() {
        delay = 1000;
    }

    function addToTerminal(string) {
        terminal.write(string);
    }

    function reset() {
        if (terminal) {
            $(terminal.element).remove();
        }

        terminal = new Terminal(window.columns, window.lines || Math.floor(window.innerHeight / 15));
        terminal.refresh();
        terminal.open();
        Terminal.focus = null;
        Terminal.cursorBlink = false;
        stopped = false;
        position = start = 0;
    }

    function tick() {
        if (window.location.hash.match(/#[0-9]+/)) {
            reset();
            var delta = 0;
            position = Number(window.location.hash.replace('#', ''), 10);

            timings.slice(0, position).forEach(function (timing) {
                delta += timing[1];
            });

            addToTerminal(script.substr(start, delta));
            $(".controls .slider").slider("value", position);
            paused = true;
            return;
        }

        if (paused) {
            return;
        }

        addToTerminal(script.substr(start, timings[position][1]));
        start += timings[position][1];
        $(".controls .slider").slider("value", position);
        position += 1;

        if (position + 1 === timings.length) {
            addToTerminal("\r\n\r\nFIN.");
            stopped = true;
        } else {
            window.setTimeout(tick, timings[position + 1][0] * delay);
        }

    }

    $('.controls .slider').slider({
        min: 0,
        max: timings.length - 1,
        slide: function () {
            window.location.hash = $(".controls .slider").slider("value");
            tick();
        }
    });

    $('.controls > a[href^=#]').click(function () {
        var command = this.href.split('#')[1];
        switch (command) {
            case "play":
                paused = !paused;


                // resume
                if (!paused) {
                    // unpausing after moving the slider
                    window.location.hash = '';
                    if (position) {
                        start = 0;
                        timings.slice(0, position).forEach(function (timing) {
                            start += timing[1];
                        });
                    }

                    tick();
                }
                else {
                    window.location.hash = position;
                }

                break;
            case "normal": normal(); break;
            case "slower": slower(); break;
            case "faster": faster(); break;
            case "replay":
                paused = false;
                reset();
                tick();
                break;
            default:
                window.location.hash = command;
                if (paused) {
                    paused = false;
                    tick();
                }
                if (stopped) {
                    reset();
                    tick();
                }
        }

        return false;
    });

    reset();
    tick();
});
