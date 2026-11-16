/**
 * Main Application Controller - Bintang Matematika
 * Mendukung Isian Langsung Numpad Virtual, Keyboard Fisik Chromebook,
 * Pilihan Jumlah Kuis (10, 15, 20 Soal), Halaman Persiapan, Stopwatch Waktu Pengerjaan,
 * Kartu Perbandingan Khusus, Papan Cakar-cakar, & Tampilan Hitung Susun.
 */

class MathApp {
    constructor() {
        this.currentQuestion = null;
        this.userAnswer = '';
        this.mode = 'practice'; // 'practice' | 'quiz' | 'time'
        this.quizLength = 10;
        this.quizCurrentIndex = 0;
        this.quizScore = 0;
        this.quizAnswers = [];
        this.quizElapsedSeconds = 0;
        this.quizStopwatchInterval = null;
        this.timerSeconds = 60;
        this.timerInterval = null;
        this.isAnswerLocked = false;
        this.isVerticalView = false;
        this.autoNextTimeout = null;
        this.isSessionActive = false;

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettingsToUI();
        this.updateStatsDisplay();
        this.setMode('practice'); // default mode latihan santai

        // Inisialisasi Papan Cakar
        setTimeout(() => {
            if (window.scratchpad) {
                window.scratchpad.init('scratchpad-canvas');
            }
        }, 120);

        // Pasang Service Worker untuk offline mode di Chromebook
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => {
                console.log('SW not registered in this context:', err);
            });
        }
    }

    loadSettingsToUI() {
        const s = window.storageManager.data.settings;
        
        // Pilih tombol operasi aktif
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.op === s.operation);
        });

        // Pilih level aktif
        const levelSelect = document.getElementById('level-select');
        if (levelSelect) levelSelect.value = s.level;

        // Pilih variasi aktif
        const varietySelect = document.getElementById('variety-select');
        if (varietySelect) varietySelect.value = s.variety;

        // Perbarui tombol suara
        this.updateSoundButton();
        this.updatePrepCardsInfo();
    }

    updateSoundButton() {
        const btn = document.getElementById('toggle-sound-btn');
        if (!btn) return;
        if (window.soundEffects.enabled) {
            btn.innerHTML = `
                <svg class="pill-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <span>Suara: ON</span>
            `;
            btn.classList.add('active');
        } else {
            btn.innerHTML = `
                <svg class="pill-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                <span>Suara: OFF</span>
            `;
            btn.classList.remove('active');
        }
    }

    updateStatsDisplay() {
        const data = window.storageManager.data;
        const streakEl = document.getElementById('streak-count');
        const starEl = document.getElementById('star-count');
        
        if (streakEl) streakEl.textContent = data.streak;
        if (starEl) starEl.textContent = data.stars;
    }

    bindEvents() {
        // Pemilihan Operasi Matematika
        document.querySelectorAll('.op-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.storageManager.updateSettings({ operation: btn.dataset.op });
                window.soundEffects.playClick();
                this.updatePrepCardsInfo();
                this.restartCurrentMode();
            });
        });

        // Pemilihan Level
        document.getElementById('level-select')?.addEventListener('change', (e) => {
            window.storageManager.updateSettings({ level: e.target.value });
            window.soundEffects.playClick();
            this.updatePrepCardsInfo();
            this.restartCurrentMode();
        });

        // Pemilihan Variasi Soal
        document.getElementById('variety-select')?.addEventListener('change', (e) => {
            window.storageManager.updateSettings({ variety: e.target.value });
            window.soundEffects.playClick();
            this.updatePrepCardsInfo();
            this.restartCurrentMode();
        });

        // Pemilihan Mode Permainan (Santai, Kuis, Waktu)
        document.querySelectorAll('.mode-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setMode(btn.dataset.mode);
                window.soundEffects.playClick();
            });
        });

        // Pemilihan Jumlah Soal Kuis (10, 15, atau 20 Soal)
        document.querySelectorAll('.length-choice-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.length-choice-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.quizLength = parseInt(btn.dataset.len, 10);
                window.soundEffects.playClick();
            });
        });

        // Tombol Mulai Kuis (dari Halaman Persiapan)
        document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
            this.startQuizSession();
        });

        // Tombol Mulai Tantangan Waktu (dari Halaman Persiapan)
        document.getElementById('start-time-btn')?.addEventListener('click', () => {
            this.startTimeSession();
        });

        // Numpad Virtual (Angka 0-9, Clear, Backspace)
        document.querySelectorAll('.num-key').forEach(key => {
            key.addEventListener('click', () => {
                this.handleKeyInput(key.dataset.val);
                this.triggerKeyVisual(key);
            });
        });

        // Kartu Pilihan Perbandingan (<, =, >)
        document.querySelectorAll('.compare-card').forEach(card => {
            card.addEventListener('click', () => {
                if (this.isAnswerLocked) return;
                document.querySelectorAll('.compare-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.userAnswer = card.dataset.val;
                this.updateAnswerInputDisplay();
                window.soundEffects.playClick();
            });
        });

        // Tombol Submit Perbandingan
        document.getElementById('compare-submit-btn')?.addEventListener('click', () => {
            this.submitAnswer();
        });
        document.getElementById('compare-next-btn')?.addEventListener('click', () => {
            window.soundEffects.playClick();
            this.nextQuestion();
        });

        // Keyboard Fisik Chromebook & Laptop
        window.addEventListener('keydown', (e) => {
            if (this.isAnswerLocked) return;
            if (document.querySelector('.modal.active')) return;
            if (!this.isSessionActive) return; // Jangan proses numpad jika masih di halaman persiapan

            // Jika dalam mode perbandingan
            if (this.currentQuestion && this.currentQuestion.promptType === 'compare') {
                if (e.key === '<' || e.key === ',' || e.key.toLowerCase() === 'k') {
                    this.selectCompareCard('<');
                } else if (e.key === '=' || e.key === 's') {
                    this.selectCompareCard('=');
                } else if (e.key === '>' || e.key === '.' || e.key.toLowerCase() === 'b') {
                    this.selectCompareCard('>');
                } else if (e.key === 'Enter') {
                    this.submitAnswer();
                }
                return;
            }

            // Mode isian angka (Numpad)
            if (e.key >= '0' && e.key <= '9') {
                this.handleKeyInput(e.key);
                const keyEl = document.querySelector(`.num-key[data-val="${e.key}"]`);
                if (keyEl) this.triggerKeyVisual(keyEl);
            } else if (e.key === 'Backspace') {
                this.handleKeyInput('backspace');
                const keyEl = document.querySelector(`.num-key[data-val="backspace"]`);
                if (keyEl) this.triggerKeyVisual(keyEl);
            } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
                this.handleKeyInput('clear');
                const keyEl = document.querySelector(`.num-key[data-val="clear"]`);
                if (keyEl) this.triggerKeyVisual(keyEl);
            } else if (e.key === 'Enter') {
                this.submitAnswer();
                const submitBtn = document.getElementById('submit-btn');
                if (submitBtn) this.triggerKeyVisual(submitBtn);
            }
        });

        // Tombol Submit / Jawab
        document.getElementById('submit-btn')?.addEventListener('click', () => {
            this.submitAnswer();
        });

        // Tombol Soal Selanjutnya
        document.getElementById('next-btn')?.addEventListener('click', () => {
            window.soundEffects.playClick();
            this.nextQuestion();
        });

        // Toggle Suara
        document.getElementById('toggle-sound-btn')?.addEventListener('click', () => {
            window.soundEffects.toggle();
            this.updateSoundButton();
            window.soundEffects.playClick();
        });

        // Toggle Papan Cakar
        const scratchpadBtn = document.getElementById('toggle-scratchpad-btn');
        const scratchpadPanel = document.getElementById('scratchpad-panel');
        const workspaceGrid = document.getElementById('workspace-grid');

        if (scratchpadBtn && scratchpadPanel) {
            scratchpadBtn.addEventListener('click', () => {
                const isOpen = scratchpadPanel.classList.toggle('open');
                scratchpadBtn.classList.toggle('active', isOpen);
                workspaceGrid?.classList.toggle('with-scratchpad', isOpen);
                setTimeout(() => window.scratchpad?.resize(), 150);
                window.soundEffects.playClick();
            });
        }

        // Kontrol Alat Cakar (Warna, Penghapus, Undo, Clear)
        document.getElementById('sp-clear')?.addEventListener('click', () => {
            window.scratchpad.clear();
            window.soundEffects.playClick();
        });
        document.getElementById('sp-undo')?.addEventListener('click', () => {
            window.scratchpad.undo();
            window.soundEffects.playClick();
        });
        document.querySelectorAll('.sp-color-dot').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sp-color-dot').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                window.scratchpad.setColor(btn.dataset.color);
                window.soundEffects.playClick();
            });
        });
        document.getElementById('sp-eraser')?.addEventListener('click', (e) => {
            document.querySelectorAll('.sp-color-dot').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
            window.scratchpad.setEraser();
            window.soundEffects.playClick();
        });

        // Toggle Hitung Susun ke Bawah
        const toggleVerticalBtn = document.getElementById('toggle-vertical-btn');
        if (toggleVerticalBtn) {
            toggleVerticalBtn.addEventListener('click', () => {
                this.isVerticalView = !this.isVerticalView;
                toggleVerticalBtn.classList.toggle('active', this.isVerticalView);
                this.renderQuestion();
                window.soundEffects.playClick();
            });
        }

        // Bantuan / Hint
        document.getElementById('hint-btn')?.addEventListener('click', () => this.showHintModal());
        document.getElementById('close-hint-modal')?.addEventListener('click', () => {
            document.getElementById('hint-modal').classList.remove('active');
        });

        // Raport & Statistik
        document.getElementById('stats-btn')?.addEventListener('click', () => this.showStatsModal());
        document.getElementById('close-stats-modal')?.addEventListener('click', () => {
            document.getElementById('stats-modal').classList.remove('active');
        });
        document.getElementById('reset-stats-btn')?.addEventListener('click', () => {
            if (confirm('Apakah kamu yakin ingin mereset seluruh data capaian & riwayat bintang?')) {
                window.storageManager.resetProgress();
                this.updateStatsDisplay();
                this.showStatsModal();
            }
        });

        // Text-to-speech bacakan soal
        document.getElementById('speech-btn')?.addEventListener('click', () => this.speakCurrentQuestion());

        // Modal Kuis Selesai
        document.getElementById('quiz-retry-btn')?.addEventListener('click', () => {
            document.getElementById('quiz-result-modal').classList.remove('active');
            if (this.mode === 'quiz') {
                this.showQuizPrepScreen();
            } else {
                this.showTimePrepScreen();
            }
        });
        document.getElementById('quiz-home-btn')?.addEventListener('click', () => {
            document.getElementById('quiz-result-modal').classList.remove('active');
            // Pilih tombol Santai di tab mode
            document.querySelectorAll('.mode-pill').forEach(b => b.classList.remove('active'));
            document.querySelector('.mode-pill[data-mode="practice"]')?.classList.add('active');
            this.setMode('practice');
        });
    }

    triggerKeyVisual(element) {
        if (!element) return;
        element.classList.add('key-pressed');
        setTimeout(() => element.classList.remove('key-pressed'), 120);
    }

    selectCompareCard(val) {
        document.querySelectorAll('.compare-card').forEach(card => {
            if (card.dataset.val === val) {
                card.classList.add('selected');
                this.triggerKeyVisual(card);
            } else {
                card.classList.remove('selected');
            }
        });
        this.userAnswer = val;
        this.updateAnswerInputDisplay();
        window.soundEffects.playClick();
    }

    setMode(mode) {
        this.mode = mode;
        clearInterval(this.timerInterval);
        clearInterval(this.quizStopwatchInterval);
        clearTimeout(this.autoNextTimeout);

        const quizProgress = document.getElementById('quiz-progress-bar-container');
        const timerContainer = document.getElementById('timer-container');
        const quizPrepCard = document.getElementById('quiz-prep-card');
        const timePrepCard = document.getElementById('time-prep-card');
        const questionPanel = document.getElementById('question-panel');

        if (mode === 'practice') {
            this.isSessionActive = true;
            if (quizProgress) quizProgress.style.display = 'none';
            if (timerContainer) timerContainer.style.display = 'none';
            if (quizPrepCard) quizPrepCard.style.display = 'none';
            if (timePrepCard) timePrepCard.style.display = 'none';
            if (questionPanel) questionPanel.style.display = 'flex';
            this.nextQuestion();
        } else if (mode === 'quiz') {
            this.showQuizPrepScreen();
        } else if (mode === 'time') {
            this.showTimePrepScreen();
        }
    }

    showQuizPrepScreen() {
        this.isSessionActive = false;
        clearInterval(this.quizStopwatchInterval);
        clearInterval(this.timerInterval);

        const quizProgress = document.getElementById('quiz-progress-bar-container');
        const timerContainer = document.getElementById('timer-container');
        const quizPrepCard = document.getElementById('quiz-prep-card');
        const timePrepCard = document.getElementById('time-prep-card');
        const questionPanel = document.getElementById('question-panel');

        if (quizProgress) quizProgress.style.display = 'none';
        if (timerContainer) timerContainer.style.display = 'none';
        if (timePrepCard) timePrepCard.style.display = 'none';
        if (questionPanel) questionPanel.style.display = 'none';
        if (quizPrepCard) quizPrepCard.style.display = 'flex';

        this.updatePrepCardsInfo();
    }

    showTimePrepScreen() {
        this.isSessionActive = false;
        clearInterval(this.quizStopwatchInterval);
        clearInterval(this.timerInterval);

        const quizProgress = document.getElementById('quiz-progress-bar-container');
        const timerContainer = document.getElementById('timer-container');
        const quizPrepCard = document.getElementById('quiz-prep-card');
        const timePrepCard = document.getElementById('time-prep-card');
        const questionPanel = document.getElementById('question-panel');

        if (quizProgress) quizProgress.style.display = 'none';
        if (timerContainer) timerContainer.style.display = 'none';
        if (quizPrepCard) quizPrepCard.style.display = 'none';
        if (questionPanel) questionPanel.style.display = 'none';
        if (timePrepCard) timePrepCard.style.display = 'flex';

        this.updatePrepCardsInfo();
    }

    startQuizSession() {
        window.soundEffects.playFanfare();
        this.isSessionActive = true;

        const quizPrepCard = document.getElementById('quiz-prep-card');
        const questionPanel = document.getElementById('question-panel');
        const quizProgress = document.getElementById('quiz-progress-bar-container');
        const timerContainer = document.getElementById('timer-container');

        if (quizPrepCard) quizPrepCard.style.display = 'none';
        if (timerContainer) timerContainer.style.display = 'none';
        if (questionPanel) questionPanel.style.display = 'flex';
        if (quizProgress) quizProgress.style.display = 'block';

        this.quizCurrentIndex = 0;
        this.quizScore = 0;
        this.quizAnswers = [];
        this.updateQuizProgressBar();

        // Mulai Stopwatch Waktu Bertambah
        this.startQuizStopwatch();

        this.nextQuestion();
    }

    startTimeSession() {
        window.soundEffects.playFanfare();
        this.isSessionActive = true;

        const timePrepCard = document.getElementById('time-prep-card');
        const questionPanel = document.getElementById('question-panel');
        const quizProgress = document.getElementById('quiz-progress-bar-container');
        const timerContainer = document.getElementById('timer-container');

        if (timePrepCard) timePrepCard.style.display = 'none';
        if (quizProgress) quizProgress.style.display = 'none';
        if (questionPanel) questionPanel.style.display = 'flex';
        if (timerContainer) timerContainer.style.display = 'inline-flex';

        this.quizScore = 0;
        this.quizAnswers = [];

        // Mulai Countdown 60s
        this.startTimer(60);

        this.nextQuestion();
    }

    startQuizStopwatch() {
        clearInterval(this.quizStopwatchInterval);
        this.quizElapsedSeconds = 0;
        const swVal = document.getElementById('quiz-stopwatch-value');
        if (swVal) swVal.textContent = '00:00';

        this.quizStopwatchInterval = setInterval(() => {
            this.quizElapsedSeconds++;
            if (swVal) {
                swVal.textContent = this.formatStopwatch(this.quizElapsedSeconds);
            }
        }, 1000);
    }

    formatStopwatch(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    formatDurationText(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (m > 0) {
            return `${m}m ${s}d`;
        }
        return `${s} detik`;
    }

    startTimer(seconds) {
        clearInterval(this.timerInterval);
        this.timerSeconds = seconds;
        const timerEl = document.getElementById('timer-value');
        if (timerEl) timerEl.textContent = this.timerSeconds + 's';

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            if (timerEl) timerEl.textContent = this.timerSeconds + 's';

            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.showTimeChallengeResult();
            }
        }, 1000);
    }

    updatePrepCardsInfo() {
        const s = window.storageManager.data.settings;
        const opName = this.getOpName(s.operation);
        const levelName = this.getLevelName(s.level);
        const varietyName = this.getVarietyName(s.variety);

        const qOp = document.getElementById('quiz-prep-op');
        const qLevel = document.getElementById('quiz-prep-level');
        const qVariety = document.getElementById('quiz-prep-variety');

        if (qOp) qOp.textContent = opName;
        if (qLevel) qLevel.textContent = levelName;
        if (qVariety) qVariety.textContent = varietyName;

        const tOp = document.getElementById('time-prep-op');
        const tLevel = document.getElementById('time-prep-level');

        if (tOp) tOp.textContent = opName;
        if (tLevel) tLevel.textContent = levelName;
    }

    getLevelName(level) {
        switch (level) {
            case 'satuan': return 'Level 1: Satuan (1 - 9)';
            case 'belasan': return 'Level 2: Belasan (10 - 50)';
            case 'puluhan': return 'Level 3: Puluhan (10 - 99)';
            case 'ratusan': return 'Level 4: Ratusan (100 - 999)';
            case 'ribuan': return 'Level 5: Ribuan (1.000 - 9.999)';
            case 'tabel': return 'Tabel Perkalian (1 - 10)';
            default: return level;
        }
    }

    getVarietyName(variety) {
        switch (variety) {
            case 'standard': return 'Standar (A + B = ?)';
            case 'missing': return 'Angka Hilang (? + B = C)';
            case 'compare': return 'Perbandingan (<, =, >)';
            case 'story': return 'Soal Cerita';
            default: return 'Campur Otomatis';
        }
    }

    restartCurrentMode() {
        if (this.mode === 'quiz') {
            if (this.isSessionActive) {
                this.startQuizSession();
            } else {
                this.showQuizPrepScreen();
            }
        } else if (this.mode === 'time') {
            if (this.isSessionActive) {
                this.startTimeSession();
            } else {
                this.showTimePrepScreen();
            }
        } else {
            this.nextQuestion();
        }
    }

    nextQuestion() {
        clearTimeout(this.autoNextTimeout);
        this.isAnswerLocked = false;
        this.userAnswer = '';

        // Ambil konfigurasi soal
        const s = window.storageManager.data.settings;
        this.currentQuestion = window.mathGenerator.generate({
            operation: s.operation,
            level: s.level,
            variety: s.variety
        });

        // Reset status feedback & tombol
        const feedbackEl = document.getElementById('feedback-box');
        if (feedbackEl) {
            feedbackEl.className = 'feedback-box hidden';
            feedbackEl.innerHTML = '';
        }

        document.getElementById('submit-btn')?.classList.remove('hidden');
        document.getElementById('next-btn')?.classList.add('hidden');
        document.getElementById('compare-submit-btn')?.classList.remove('hidden');
        document.getElementById('compare-next-btn')?.classList.add('hidden');

        // Bersihkan seleksi kartu perbandingan
        document.querySelectorAll('.compare-card').forEach(c => c.classList.remove('selected'));

        this.renderQuestion();
        this.updateAnswerInputDisplay();
    }

    renderQuestion() {
        const q = this.currentQuestion;
        if (!q) return;

        const container = document.getElementById('question-display-area');
        const questionPromptText = document.getElementById('question-prompt-text');
        const toggleVerticalBtn = document.getElementById('toggle-vertical-btn');
        const numpadWrapper = document.getElementById('numpad-wrapper');
        const compareWrapper = document.getElementById('compare-wrapper');

        if (questionPromptText) {
            questionPromptText.textContent = q.questionText;
        }

        // Tampilkan toggle hitung susun jika soal mendukung
        if (toggleVerticalBtn) {
            if (q.layoutType === 'vertical_capable') {
                toggleVerticalBtn.style.display = 'inline-flex';
            } else {
                toggleVerticalBtn.style.display = 'none';
                this.isVerticalView = false;
                toggleVerticalBtn.classList.remove('active');
            }
        }

        // Tampilkan Numpad atau Perbandingan
        if (q.promptType === 'compare') {
            if (numpadWrapper) numpadWrapper.style.display = 'none';
            if (compareWrapper) compareWrapper.style.display = 'block';
        } else {
            if (numpadWrapper) numpadWrapper.style.display = 'block';
            if (compareWrapper) compareWrapper.style.display = 'none';
        }

        // Render Format Soal
        if (this.isVerticalView && q.layoutType === 'vertical_capable') {
            // Tampilan Hitung Susun Ke Bawah
            container.innerHTML = `
                <div class="vertical-math-card animate-pop">
                    <div class="v-num v-top">${window.mathGenerator.formatNumber(q.a)}</div>
                    <div class="v-num v-bottom"><span class="v-op">${q.symbol}</span> ${window.mathGenerator.formatNumber(q.b)}</div>
                    <div class="v-line"></div>
                    <div class="v-answer-container">
                        <div class="interactive-slot inline-slot" id="main-answer-slot">
                            <span class="slot-text" id="slot-text">?</span>
                            <span class="cursor-blink">|</span>
                        </div>
                    </div>
                </div>
            `;
        } else if (q.variety === 'story') {
            // Tampilan Soal Cerita
            container.innerHTML = `
                <div class="story-math-card animate-pop">
                    <div class="story-bubble">
                        <div class="story-avatar">🎒</div>
                        <p class="story-text">${q.display}</p>
                    </div>
                    <div class="story-answer-row">
                        <span class="story-ans-label">Jawab:</span>
                        <div class="interactive-slot inline-slot" id="main-answer-slot">
                            <span class="slot-text" id="slot-text">?</span>
                            <span class="cursor-blink">|</span>
                        </div>
                        <span class="story-unit">${q.storyData ? q.storyData.item : ''}</span>
                    </div>
                </div>
            `;
        } else if (q.variety === 'missing') {
            // Tampilan Angka Hilang
            if (q.missingTarget === 'a') {
                container.innerHTML = `
                    <div class="horizontal-equation animate-pop">
                        <div class="interactive-slot inline-slot" id="main-answer-slot">
                            <span class="slot-text" id="slot-text">?</span>
                            <span class="cursor-blink">|</span>
                        </div>
                        <span class="eq-op">${q.symbol}</span>
                        <span class="eq-num">${window.mathGenerator.formatNumber(q.b)}</span>
                        <span class="eq-equals">=</span>
                        <span class="eq-num eq-res">${window.mathGenerator.formatNumber(q.result)}</span>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="horizontal-equation animate-pop">
                        <span class="eq-num">${window.mathGenerator.formatNumber(q.a)}</span>
                        <span class="eq-op">${q.symbol}</span>
                        <div class="interactive-slot inline-slot" id="main-answer-slot">
                            <span class="slot-text" id="slot-text">?</span>
                            <span class="cursor-blink">|</span>
                        </div>
                        <span class="eq-equals">=</span>
                        <span class="eq-num eq-res">${window.mathGenerator.formatNumber(q.result)}</span>
                    </div>
                `;
            }
        } else if (q.promptType === 'compare') {
            // Tampilan Perbandingan Nilai
            container.innerHTML = `
                <div class="horizontal-equation animate-pop">
                    <div class="compare-side side-left">
                        <span class="eq-num">${window.mathGenerator.formatNumber(q.a)}</span>
                        <span class="eq-op">${q.symbol}</span>
                        <span class="eq-num">${window.mathGenerator.formatNumber(q.b)}</span>
                    </div>
                    <div class="interactive-slot compare-slot inline-slot" id="main-answer-slot">
                        <span class="slot-text" id="slot-text">?</span>
                    </div>
                    <div class="compare-side side-right">
                        <span class="eq-num">${window.mathGenerator.formatNumber(q.rightCompareValue)}</span>
                    </div>
                </div>
            `;
        } else {
            // Standar: A + B = [ ? ]
            container.innerHTML = `
                <div class="horizontal-equation animate-pop">
                    <span class="eq-num">${window.mathGenerator.formatNumber(q.a)}</span>
                    <span class="eq-op">${q.symbol}</span>
                    <span class="eq-num">${window.mathGenerator.formatNumber(q.b)}</span>
                    <span class="eq-equals">=</span>
                    <div class="interactive-slot inline-slot" id="main-answer-slot">
                        <span class="slot-text" id="slot-text">?</span>
                        <span class="cursor-blink">|</span>
                    </div>
                </div>
            `;
        }
    }

    handleKeyInput(val) {
        if (this.isAnswerLocked) return;

        window.soundEffects.playClick();

        if (val === 'clear') {
            this.userAnswer = '';
        } else if (val === 'backspace') {
            this.userAnswer = this.userAnswer.slice(0, -1);
        } else {
            // Maksimal 7 digit angka
            if (this.userAnswer.length < 7) {
                this.userAnswer += val;
            }
        }

        this.updateAnswerInputDisplay();
    }

    updateAnswerInputDisplay() {
        const slotEl = document.getElementById('main-answer-slot');
        const textEl = document.getElementById('slot-text');

        if (!slotEl || !textEl) return;

        if (this.userAnswer === '') {
            textEl.textContent = '?';
            slotEl.classList.remove('filled');
        } else {
            textEl.textContent = this.userAnswer;
            slotEl.classList.add('filled');
        }
    }

    submitAnswer() {
        if (this.isAnswerLocked || !this.currentQuestion) return;

        if (this.userAnswer === '') {
            // Animasi getar jika jawaban belum diisi
            const slotEl = document.getElementById('main-answer-slot');
            slotEl?.classList.add('shake');
            window.soundEffects.playWrong();
            setTimeout(() => slotEl?.classList.remove('shake'), 450);
            return;
        }

        this.isAnswerLocked = true;
        const isCorrect = this.checkCorrectness(this.userAnswer, this.currentQuestion.answer);

        // Rekam data statistik
        window.storageManager.recordAnswer(isCorrect, this.currentQuestion);
        this.updateStatsDisplay();

        const slotEl = document.getElementById('main-answer-slot');
        const feedbackEl = document.getElementById('feedback-box');
        const submitBtn = document.getElementById('submit-btn');
        const nextBtn = document.getElementById('next-btn');
        const cmpSubmitBtn = document.getElementById('compare-submit-btn');
        const cmpNextBtn = document.getElementById('compare-next-btn');

        if (submitBtn) submitBtn.classList.add('hidden');
        if (cmpSubmitBtn) cmpSubmitBtn.classList.add('hidden');

        if (isCorrect) {
            slotEl?.classList.add('slot-correct');
            window.soundEffects.playCorrect();
            window.confettiEffect.burst(window.innerWidth / 2, window.innerHeight / 2, 45);

            if (feedbackEl) {
                feedbackEl.className = 'feedback-box correct animate-pop';
                feedbackEl.innerHTML = `
                    <div class="feedback-badge-icon">🎉</div>
                    <div class="feedback-text-group">
                        <strong class="fb-title">Hebat Sekali! Jawabanmu Tepat!</strong>
                        <span class="fb-desc">+1 Bintang berhasil dikumpulkan! ⭐</span>
                    </div>
                `;
            }

            if (window.storageManager.data.streak > 0 && window.storageManager.data.streak % 5 === 0) {
                window.soundEffects.playStreak();
            }

            if (this.mode === 'quiz' || this.mode === 'time') {
                this.quizScore++;
            }
        } else {
            slotEl?.classList.add('slot-wrong');
            window.soundEffects.playWrong();

            const correctFormatted = typeof this.currentQuestion.answer === 'number'
                ? window.mathGenerator.formatNumber(this.currentQuestion.answer)
                : this.currentQuestion.answer;

            if (feedbackEl) {
                feedbackEl.className = 'feedback-box wrong animate-shake';
                feedbackEl.innerHTML = `
                    <div class="feedback-badge-icon">💡</div>
                    <div class="feedback-text-group">
                        <strong class="fb-title">Hampir Benar, Ayo Semangat!</strong>
                        <span class="fb-desc">Jawaban yang tepat adalah: <span class="correct-highlight">${correctFormatted}</span></span>
                    </div>
                `;
            }
        }

        // Penanganan alur kuis
        if (this.mode === 'quiz') {
            this.quizAnswers.push({
                question: this.currentQuestion,
                userAnswer: this.userAnswer,
                isCorrect: isCorrect
            });
            this.quizCurrentIndex++;
            this.updateQuizProgressBar();

            if (this.quizCurrentIndex >= this.quizLength) {
                setTimeout(() => this.showQuizResult(), 1100);
                return;
            }
        }

        // Lanjut ke soal berikutnya
        if (this.mode === 'time') {
            setTimeout(() => this.nextQuestion(), 550);
        } else if (this.mode === 'quiz') {
            setTimeout(() => this.nextQuestion(), 950);
        } else {
            // Mode Santai
            if (nextBtn) nextBtn.classList.remove('hidden');
            if (cmpNextBtn) cmpNextBtn.classList.remove('hidden');

            if (isCorrect) {
                // Auto lanjut setelah 1.2 detik jika benar
                this.autoNextTimeout = setTimeout(() => {
                    if (this.isAnswerLocked) {
                        this.nextQuestion();
                    }
                }, 1250);
            }
        }
    }

    checkCorrectness(userVal, correctVal) {
        if (typeof correctVal === 'number') {
            return parseInt(userVal, 10) === correctVal;
        }
        return userVal.trim() === correctVal.toString().trim();
    }

    updateQuizProgressBar() {
        const fill = document.getElementById('quiz-progress-fill');
        const text = document.getElementById('quiz-progress-text');
        const percent = (this.quizCurrentIndex / this.quizLength) * 100;

        if (fill) fill.style.width = percent + '%';
        if (text) text.textContent = `Soal ${Math.min(this.quizCurrentIndex + 1, this.quizLength)} dari ${this.quizLength}`;
    }

    showQuizResult() {
        // Hentikan Stopwatch
        clearInterval(this.quizStopwatchInterval);
        window.soundEffects.playFanfare();
        window.confettiEffect.burst(window.innerWidth / 2, window.innerHeight / 2, 85);

        const modal = document.getElementById('quiz-result-modal');
        const s = window.storageManager.data.settings;

        const totalSecs = this.quizElapsedSeconds;
        const totalDuration = this.formatDurationText(totalSecs);
        const avgSecs = (totalSecs / this.quizLength).toFixed(1);
        const avgText = `${avgSecs} detik / soal`;

        window.storageManager.recordQuiz({
            score: this.quizScore,
            total: this.quizLength,
            operation: s.operation,
            level: s.level,
            durationText: totalDuration,
            avgPerQuestion: avgText
        });
        this.updateStatsDisplay();

        const percent = Math.round((this.quizScore / this.quizLength) * 100);
        let starBadge = '⭐⭐⭐';
        let gradeMessage = 'Luar Biasa Sempurna! Kamu Sang Bintang Matematika!';

        if (percent < 50) {
            starBadge = '⭐';
            gradeMessage = 'Ayo terus berlatih, dengan banyak latihan kamu pasti semakin pintar!';
        } else if (percent < 80) {
            starBadge = '⭐⭐';
            gradeMessage = 'Hebat sekali! Sedikit lagi menuju nilai sempurna!';
        }

        document.getElementById('result-stars-badge').textContent = starBadge;
        document.getElementById('result-score-text').textContent = `${this.quizScore} / ${this.quizLength}`;
        document.getElementById('result-percentage-text').textContent = `Nilai: ${percent}`;
        document.getElementById('result-grade-message').textContent = gradeMessage;

        // Tampilkan Aspek Waktu Pengerjaan di Rapor
        const timeRow = document.getElementById('result-time-row');
        if (timeRow) timeRow.style.display = 'grid';
        const totalTimeEl = document.getElementById('result-total-time');
        const avgTimeEl = document.getElementById('result-avg-time');
        if (totalTimeEl) totalTimeEl.textContent = totalDuration;
        if (avgTimeEl) avgTimeEl.textContent = avgText;

        const reviewList = document.getElementById('quiz-review-list');
        if (reviewList) {
            reviewList.innerHTML = this.quizAnswers.map((item, idx) => `
                <div class="review-row ${item.isCorrect ? 'row-correct' : 'row-wrong'}">
                    <span class="row-icon">${item.isCorrect ? '✅' : '❌'}</span>
                    <div class="row-info">
                        <div class="row-q">#${idx + 1}. ${item.question.display}</div>
                        <div class="row-ans">Jawabanmu: <strong>${item.userAnswer}</strong> ${item.isCorrect ? '' : `(Kunci: <strong>${item.question.answer}</strong>)`}</div>
                    </div>
                </div>
            `).join('');
        }

        modal?.classList.add('active');
    }

    showTimeChallengeResult() {
        window.soundEffects.playFanfare();
        const modal = document.getElementById('quiz-result-modal');
        document.getElementById('result-stars-badge').textContent = '⏱️⚡';
        document.getElementById('result-score-text').textContent = `${this.quizScore} Soal Terjawab Benar`;
        document.getElementById('result-percentage-text').textContent = `Tantangan Waktu 60 Detik Selesai!`;
        document.getElementById('result-grade-message').textContent = `Kecepatan berhitung yang sangat mantap! Terus asah kecepatan otakmu!`;

        // Sembunyikan aspek waktu kuis di rapor time challenge karena sudah jelas 60 detik
        const timeRow = document.getElementById('result-time-row');
        if (timeRow) timeRow.style.display = 'none';

        const reviewList = document.getElementById('quiz-review-list');
        if (reviewList) reviewList.innerHTML = '';

        modal?.classList.add('active');
    }

    showHintModal() {
        if (!this.currentQuestion) return;
        window.soundEffects.playClick();
        const modal = document.getElementById('hint-modal');
        const content = document.getElementById('hint-modal-content');
        if (content) {
            content.innerHTML = `
                <div class="hint-body">
                    <div class="hint-question-tag">${this.currentQuestion.display}</div>
                    <pre class="hint-pre-box">${this.currentQuestion.explanation}</pre>
                </div>
            `;
        }
        modal?.classList.add('active');
    }

    showStatsModal() {
        window.soundEffects.playClick();
        const modal = document.getElementById('stats-modal');
        const data = window.storageManager.data;

        document.getElementById('stat-total-q').textContent = data.totalQuestions;
        document.getElementById('stat-total-c').textContent = data.totalCorrect;
        const acc = data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0;
        document.getElementById('stat-accuracy').textContent = acc + '%';
        document.getElementById('stat-best-streak').textContent = data.bestStreak;

        const historyContainer = document.getElementById('stats-history-list');
        if (historyContainer) {
            if (data.history.length === 0) {
                historyContainer.innerHTML = '<p class="empty-notice">Belum ada riwayat kuis. Ayo selesaikan 1 kuis untuk mendapatkan rapor!</p>';
            } else {
                historyContainer.innerHTML = data.history.map(item => `
                    <div class="history-row">
                        <div class="hist-time">${item.date} ${item.time}</div>
                        <div class="hist-mode">${this.getOpName(item.operation)} (${item.level})</div>
                        <div class="hist-score">
                            <strong>${item.score}/${item.total}</strong> (${item.percentage}%)
                            ${item.durationText && item.durationText !== '-' ? `<span class="hist-duration-pill">⏱️ ${item.durationText}</span>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }

        modal?.classList.add('active');
    }

    getOpName(op) {
        switch (op) {
            case 'add': return 'Tambah (+)';
            case 'sub': return 'Kurang (−)';
            case 'mul': return 'Kali (×)';
            case 'div': return 'Bagi (÷)';
            default: return 'Campuran (🔀)';
        }
    }

    speakCurrentQuestion() {
        if (!('speechSynthesis' in window) || !this.currentQuestion) return;

        window.soundEffects.playClick();
        window.speechSynthesis.cancel();

        let text = '';
        const q = this.currentQuestion;

        if (q.variety === 'story') {
            text = q.display;
        } else {
            let opSpoken = 'tambah';
            if (q.operation === 'sub') opSpoken = 'kurang';
            if (q.operation === 'mul') opSpoken = 'kali';
            if (q.operation === 'div') opSpoken = 'bagi';

            if (q.promptType === 'compare') {
                text = `Bandingkanlah: ${q.a} ${opSpoken} ${q.b} dengan ${q.rightCompareValue}`;
            } else if (q.variety === 'missing') {
                if (q.missingTarget === 'a') {
                    text = `Titik-titik ${opSpoken} ${q.b} sama dengan ${q.result}. Berapakah angka titik-titik tersebut?`;
                } else {
                    text = `${q.a} ${opSpoken} titik-titik sama dengan ${q.result}. Berapakah angka titik-titik tersebut?`;
                }
            } else {
                text = `Berapakah ${q.a} ${opSpoken} ${q.b}?`;
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mathApp = new MathApp();
});
