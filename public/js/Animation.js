var Animation = function (settings) {
    this.settings = settings || {};
    this.name = this.settings.name;
    this.type = this.settings.type || Animation.types.LINEAR;
    this.frames = this.settings.frames;
    updateFuncs.push(proxy(this.update, this));
};

Animation.types = {
    LINEAR: 'linear',
    PING_PONG: 'pingpong',
    LOOP: 'loop'
};

Animation.prototype = {
    name: '',
    type: null,
    animationSpeed: 1,
    animationDirection: 1,
    frames: [],
    currentFrameIndex: 0,
    elapsed: 0,
    playing: false,
    paused: false,
    getFrame: function () {
        if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.frames.length) {
            return this.frames[this.currentFrameIndex];
        }
        return _.extend({}, Frame.prototype);
    },
    getSprite: function () {
        return this.getFrame().sprite;
    },
    atEnd: function () {
        if (this.type === Animation.types.PING_PONG) {
            if (this.animationDirection > 0) {
                return this.currentFrameIndex >= this.frames.length;
            } else {
                return this.currentFrameIndex == 0;
            }
        }

        return this.currentFrameIndex >= this.frames.length;
    },
    setNext: function () {
        this.parent.root.removeChild(this.getSprite());
        this.currentFrameIndex += this.animationDirection;
        if (this.atEnd()) {
            if (this.type === Animation.types.PING_PONG) { // change direction
                this.animationDirection *= -1;
                if (this.currentFrameIndex === this.frames.length) {
                    this.currentFrameIndex += this.animationDirection * 2;
                }
            } else if (this.type === Animation.types.LOOP) { // loop
                this.currentFrameIndex = 0;
            } else { // LINEAR
                this.currentFrameIndex = this.frames.length - 1; // stop at end
            }
        }
        this.parent.root.addChild(this.getSprite());
    },
    stop: function () {
        if (this.playing) {
            this.playing = false;
            this.paused = false;
            this.elapsed = 0;
            this.parent.root.removeChild(this.getSprite());
        }
        return this;
    },
    pause: function () {
        this.playing = false;
        this.paused = true;
        return this;
    },
    start: function () {
        if (!this.playing) {
            this.playing = true;
            if (!this.paused) {
                this.elapsed = 0;
            }
            this.paused = false;
            this.parent.root.addChild(this.getSprite());
        }
        return this;
    },
    update: function (delta, now) {
        if (this.playing) {
            this.elapsed += delta * this.animationSpeed;
            while (this.elapsed > this.getFrame().duration) {
                this.elapsed -= this.getFrame().duration;
                this.setNext();
            }
        }
    }
}