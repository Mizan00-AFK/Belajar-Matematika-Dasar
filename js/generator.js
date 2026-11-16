/**
 * Generator Soal Matematika Otomatis & Bervariasi
 * Mencakup Satuan, Belasan, Puluhan, Ratusan, Ribuan, serta variasi (standar, angka hilang, perbandingan, cerita).
 */

class MathGenerator {
    constructor() {
        this.items = [
            'apel', 'permen', 'buku', 'pensil', 'kelereng', 'jeruk', 
            'balon', 'roti', 'kue', 'stiker', 'penghapus', 'bintang'
        ];
        this.names = ['Budi', 'Siti', 'Andi', 'Rani', 'Doni', 'Dewi', 'Eko', 'Ayu'];
    }

    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getRange(level) {
        switch (level) {
            case 'satuan':
                return { min: 1, max: 9 };
            case 'belasan':
                return { min: 10, max: 50 };
            case 'puluhan':
                return { min: 10, max: 99 };
            case 'ratusan':
                return { min: 100, max: 999 };
            case 'ribuan':
                return { min: 1000, max: 9999 };
            case 'tabel':
                return { min: 1, max: 10 };
            default:
                return { min: 1, max: 9 };
        }
    }

    formatNumber(num) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString('id-ID');
    }

    generate(config) {
        let op = config.operation;
        if (op === 'mixed') {
            const ops = ['add', 'sub', 'mul', 'div'];
            op = this.randChoice(ops);
        }

        const level = config.level || 'satuan';
        const varietyPref = config.variety || 'auto';
        
        let variety = varietyPref;
        if (variety === 'auto') {
            const r = Math.random();
            if (r < 0.50) variety = 'standard';
            else if (r < 0.75) variety = 'missing';
            else if (r < 0.90) variety = 'compare';
            else variety = 'story';
        }

        if (level === 'tabel') {
            op = 'mul';
            if (variety === 'compare' || variety === 'story') {
                variety = Math.random() < 0.7 ? 'standard' : 'missing';
            }
        }

        let a, b, result, symbol, explanation, questionText, layoutType = 'horizontal';
        const range = this.getRange(level);

        if (op === 'add') {
            symbol = '+';
            a = this.randInt(range.min, range.max);
            b = this.randInt(range.min, range.max);
            result = a + b;
            explanation = this.explainAddition(a, b, result);
        } else if (op === 'sub') {
            symbol = '−';
            const num1 = this.randInt(range.min, range.max);
            const num2 = this.randInt(range.min, range.max);
            a = Math.max(num1, num2);
            b = Math.min(num1, num2);
            result = a - b;
            explanation = this.explainSubtraction(a, b, result);
        } else if (op === 'mul') {
            symbol = '×';
            if (level === 'satuan' || level === 'tabel') {
                a = this.randInt(1, 10);
                b = this.randInt(1, 10);
            } else if (level === 'belasan') {
                a = this.randInt(5, 20);
                b = this.randInt(2, 9);
            } else if (level === 'puluhan') {
                a = this.randInt(10, 99);
                b = this.randInt(2, 9);
            } else if (level === 'ratusan') {
                a = this.randInt(100, 500);
                b = this.randInt(2, 9);
            } else {
                a = this.randInt(1000, 2500);
                b = this.randInt(2, 5);
            }
            result = a * b;
            explanation = this.explainMultiplication(a, b, result);
        } else if (op === 'div') {
            symbol = '÷';
            let divisor, quotient;
            if (level === 'satuan' || level === 'tabel') {
                divisor = this.randInt(1, 9);
                quotient = this.randInt(1, 9);
            } else if (level === 'belasan') {
                divisor = this.randInt(2, 9);
                quotient = this.randInt(5, 20);
            } else if (level === 'puluhan') {
                divisor = this.randInt(2, 9);
                quotient = this.randInt(10, 50);
            } else if (level === 'ratusan') {
                divisor = this.randInt(2, 9);
                quotient = this.randInt(50, 200);
            } else {
                divisor = this.randInt(2, 9);
                quotient = this.randInt(100, 1000);
            }
            a = divisor * quotient;
            b = divisor;
            result = quotient;
            explanation = this.explainDivision(a, b, result);
        }

        let promptType = 'input'; // 'input' | 'compare'
        let missingTarget = 'res'; // 'a' | 'b' | 'res'
        let answer = result;
        let display = '';
        let storyData = null;
        let rightCompareValue = null;

        if (variety === 'standard') {
            display = `${this.formatNumber(a)} ${symbol} ${this.formatNumber(b)} = ?`;
            questionText = 'Hitunglah hasil operasi di bawah ini:';
            missingTarget = 'res';
            answer = result;
            if (['puluhan', 'ratusan', 'ribuan'].includes(level) && (op === 'add' || op === 'sub' || op === 'mul')) {
                layoutType = 'vertical_capable';
            }
        } else if (variety === 'missing') {
            const pickLeft = Math.random() < 0.5;
            if (pickLeft) {
                // [ ? ] op B = Result
                display = `[ ? ] ${symbol} ${this.formatNumber(b)} = ${this.formatNumber(result)}`;
                questionText = 'Berapakah angka yang tepat untuk mengisi tanda [ ? ]:';
                missingTarget = 'a';
                answer = a;
            } else {
                // A op [ ? ] = Result
                display = `${this.formatNumber(a)} ${symbol} [ ? ] = ${this.formatNumber(result)}`;
                questionText = 'Berapakah angka yang tepat untuk melengkapi persamaan:';
                missingTarget = 'b';
                answer = b;
            }
        } else if (variety === 'compare') {
            promptType = 'compare';
            const offset = this.randChoice([-3, -2, -1, 0, 0, 1, 2, 3]);
            rightCompareValue = Math.max(0, result + offset);
            display = `${this.formatNumber(a)} ${symbol} ${this.formatNumber(b)}  [ ? ]  ${this.formatNumber(rightCompareValue)}`;
            questionText = 'Bandingkan kedua sisi: Lebih Kecil (<), Sama Dengan (=), atau Lebih Besar (>):';

            if (result > rightCompareValue) answer = '>';
            else if (result < rightCompareValue) answer = '<';
            else answer = '=';

            explanation = `💡 Sisi kiri: ${a} ${symbol} ${b} = ${result}.\n` +
                          `Sisi kanan: ${rightCompareValue}.\n` +
                          `Karena ${result} ${answer === '=' ? 'sama dengan' : (answer === '>' ? 'lebih besar dari (>)' : 'lebih kecil dari (<)')} ${rightCompareValue}, maka tanda yang benar adalah "${answer}".`;
        } else if (variety === 'story') {
            const name1 = this.randChoice(this.names);
            const name2 = this.randChoice(this.names.filter(n => n !== name1));
            const item = this.randChoice(this.items);
            let storyText = '';

            if (op === 'add') {
                storyText = `${name1} memiliki ${this.formatNumber(a)} buah ${item}. Kemudian ${name2} memberikan lagi ${this.formatNumber(b)} buah ${item}. Berapa total ${item} yang dimiliki ${name1} sekarang?`;
            } else if (op === 'sub') {
                storyText = `${name1} mula-mula memiliki ${this.formatNumber(a)} butir ${item}. Sebanyak ${this.formatNumber(b)} butir ${item} diberikan kepada temannya. Berapa sisa ${item} milik ${name1}?`;
            } else if (op === 'mul') {
                storyText = `Ibu membeli ${a} kantong ${item}. Di dalam setiap kantong terdapat ${b} buah ${item}. Berapa total seluruh ${item} yang dibeli Ibu?`;
            } else {
                storyText = `${name1} mempunyai ${a} permen ${item} dan ingin membagikannya rata kepada ${b} orang sahabatnya. Berapa permen yang didapatkan setiap anak?`;
            }

            display = storyText;
            questionText = 'Baca soal cerita berikut lalu ketikkan jawabannya:';
            missingTarget = 'res';
            answer = result;
            storyData = { name: name1, item: item, text: storyText };
        }

        return {
            id: 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            operation: op,
            level: level,
            variety: variety,
            symbol: symbol,
            a: a,
            b: b,
            result: result,
            answer: answer,
            display: display,
            questionText: questionText,
            promptType: promptType,
            missingTarget: missingTarget,
            layoutType: layoutType,
            storyData: storyData,
            rightCompareValue: rightCompareValue,
            explanation: explanation
        };
    }

    explainAddition(a, b, res) {
        if (a < 10 && b < 10) {
            return `💡 ${a} + ${b} = ${res}.\nKamu bisa menghitung maju sebanyak ${b} langkah setelah angka ${a}.`;
        }
        return `💡 Penjumlahan Susun:\n` +
               `    ${a}\n` +
               `  + ${b}\n` +
               `  -------\n` +
               `    ${res}\n` +
               `👉 Langkah:\n1. Jumlahkan angka satuan dari kanan terlebih dahulu.\n2. Jika hasilnya 10 atau lebih, tulis angka satuan dan simpan angka puluhannya di atas kolom puluhan.`;
    }

    explainSubtraction(a, b, res) {
        if (a < 10) {
            return `💡 ${a} − ${b} = ${res}.\nJika ada ${a} benda lalu diambil ${b}, maka sisanya adalah ${res}.`;
        }
        return `💡 Pengurangan Susun:\n` +
               `    ${a}\n` +
               `  − ${b}\n` +
               `  -------\n` +
               `    ${res}\n` +
               `👉 Langkah:\n1. Kurangkan kolom satuan paling kanan.\n2. Jika angka di atas lebih kecil dari angka di bawah, pinjam 1 dari kolom puluhan di depannya.`;
    }

    explainMultiplication(a, b, res) {
        if (a <= 10 && b <= 10) {
            return `💡 Perkalian adalah penjumlahan berulang:\n${a} × ${b} artinya angka ${b} dijumlahkan sebanyak ${a} kali.\n${a} × ${b} = ${res}.`;
        }
        return `💡 Perkalian Susun:\n` +
               `    ${a}\n` +
               `  ×  ${b}\n` +
               `  -------\n` +
               `    ${res}\n` +
               `👉 Langkah: Kalikan setiap digit bilangan di atas dengan angka pengali mulai dari satuan ke puluhan.`;
    }

    explainDivision(a, b, res) {
        return `💡 Pembagian adalah kebalikan dari perkalian:\n` +
               `${a} ÷ ${b} = ${res}\n` +
               `karena ${res} × ${b} = ${a}.\n` +
               `Benda sebanyak ${a} buah jika dibagi rata menjadi ${b} kelompok, masing-masing kelompok berisi ${res} buah.`;
    }
}

window.mathGenerator = new MathGenerator();
