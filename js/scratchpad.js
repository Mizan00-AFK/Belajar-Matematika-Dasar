/**
 * Papan Cakar-cakar (Scratchpad / Canvas Doodle)
 * Sangat berguna di Chromebook untuk menghitung susun ke bawah langsung di layar
 * Mendukung Mouse, Touchscreen (layar sentuh), dan Stylus / Pen.
 */
class Scratchpad {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.color = '#1e3a8a'; // default blue pen
        this.lineWidth = 3;
        this.isEraser = false;
        this.history = [];
        this.maxHistory = 20;
    }

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.setupEvents();
        this.saveState();

        window.addEventListener('resize', () => {
            const temp = this.canvas.toDataURL();
            this.resize();
            const img = new Image();
            img.onload = () => this.ctx.drawImage(img, 0, 0);
            img.src = temp;
        });
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height || 360;
    }

    setupEvents() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const start = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.strokeStyle = this.isEraser ? '#f8fafc' : this.color;
            this.ctx.lineWidth = this.isEraser ? 20 : this.lineWidth;
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        };

        const stop = (e) => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.ctx.closePath();
                this.saveState();
            }
        };

        // Pointer / Touch / Mouse unified listeners
        this.canvas.addEventListener('mousedown', start);
        this.canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stop);

        this.canvas.addEventListener('touchstart', start, { passive: false });
        this.canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stop);
        window.addEventListener('touchcancel', stop);
    }

    saveState() {
        if (!this.canvas) return;
        if (this.history.length >= this.maxHistory) {
            this.history.shift();
        }
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop(); // buang state saat ini
            const prevState = this.history[this.history.length - 1];
            this.ctx.putImageData(prevState, 0, 0);
        } else if (this.history.length === 1) {
            this.clear(false);
        }
    }

    setColor(c) {
        this.color = c;
        this.isEraser = false;
        if (this.canvas) {
            this.canvas.classList.remove('eraser-mode');
        }
    }

    setEraser() {
        this.isEraser = true;
        if (this.canvas) {
            this.canvas.classList.add('eraser-mode');
        }
    }

    clear(save = true) {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (save) {
            this.saveState();
        }
    }
}

window.scratchpad = new Scratchpad();
