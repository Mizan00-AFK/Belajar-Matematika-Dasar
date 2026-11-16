/**
 * Pengelola Data Lokal (LocalStorage)
 * Menyimpan statistik belajar, skor tertinggi, bintang terkumpul, dan pengaturan.
 */
class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'bintang_matematika_data';
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.error('Gagal membaca localStorage', e);
        }

        return {
            totalQuestions: 0,
            totalCorrect: 0,
            stars: 0,
            streak: 0,
            bestStreak: 0,
            history: [], // Riwayat kuis terakhir
            settings: {
                operation: 'add',
                level: 'satuan',
                variety: 'auto',
                inputMode: 'both', // 'numpad', 'multiple_choice', 'both'
                timerMode: false,
                quizLength: 10
            }
        };
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Gagal menyimpan ke localStorage', e);
        }
    }

    recordAnswer(isCorrect, questionData) {
        this.data.totalQuestions++;
        if (isCorrect) {
            this.data.totalCorrect++;
            this.data.stars += 1;
            this.data.streak++;
            if (this.data.streak > this.data.bestStreak) {
                this.data.bestStreak = this.data.streak;
            }
        } else {
            this.data.streak = 0;
        }
        this.save();
    }

    recordQuiz(quizSummary) {
        this.data.history.unshift({
            date: new Date().toLocaleDateString('id-ID'),
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            score: quizSummary.score,
            total: quizSummary.total,
            percentage: Math.round((quizSummary.score / quizSummary.total) * 100),
            operation: quizSummary.operation,
            level: quizSummary.level,
            durationText: quizSummary.durationText || '-',
            avgPerQuestion: quizSummary.avgPerQuestion || '-'
        });

        // Simpan 20 riwayat terakhir
        if (this.data.history.length > 20) {
            this.data.history.pop();
        }

        this.save();
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    resetProgress() {
        this.data.totalQuestions = 0;
        this.data.totalCorrect = 0;
        this.data.stars = 0;
        this.data.streak = 0;
        this.data.bestStreak = 0;
        this.data.history = [];
        this.save();
    }
}

window.storageManager = new StorageManager();
