

import { Question } from "./types";

// ============================================================================
// DATA STORAGE NOTE:
// Giáo viên có thể chỉnh sửa trực tiếp nội dung ở đây.
// Cấu trúc mảng JSON giúp dễ dàng thêm/bớt câu hỏi.
// ============================================================================

// ROUND 1: REFLEX (VẤN ĐÁP/TRỰC TIẾP) - Target: 50 Questions
// Dạng: Khái niệm, Tính toán, Nhận biết, Mô tả
export const ROUND_1_QUESTIONS: Question[] = [
    // --- Khái niệm cơ bản ---
    { id: 'r1-1', content: 'Từ khóa nào dùng để khai báo hàm trong Python?', answer: 'def', points: 10 },
    { id: 'r1-2', content: 'Input() trả về kiểu dữ liệu gì?', answer: 'String (str)', points: 10 },
    { id: 'r1-3', content: 'Hàm nào dùng để tính độ dài của danh sách?', answer: 'len()', points: 10 },
    { id: 'r1-4', content: 'Để chuyển chuỗi thành số nguyên, dùng hàm gì?', answer: 'int()', points: 10 },
    { id: 'r1-5', content: 'True và False thuộc kiểu dữ liệu nào?', answer: 'Boolean (bool)', points: 10 },
    
    // --- Tính toán ---
    { id: 'r1-6', content: '5 // 2 bằng bao nhiêu?', answer: '2', points: 10 },
    { id: 'r1-7', content: '5 % 2 bằng bao nhiêu?', answer: '1', points: 10 },
    { id: 'r1-8', content: '2 ** 3 bằng bao nhiêu?', answer: '8', points: 10 },
    { id: 'r1-9', content: '10 != 10 trả về True hay False?', answer: 'False', points: 10 },
    { id: 'r1-10', content: 'not True là gì?', answer: 'False', points: 10 },

    // --- Cú pháp/Lệnh ---
    { id: 'r1-11', content: 'Lệnh nào dùng để in ra màn hình?', answer: 'print()', points: 10 },
    { id: 'r1-12', content: 'Ký hiệu nào dùng để comment?', answer: '#', points: 10 },
    { id: 'r1-13', content: 'Vòng lặp nào dùng khi biết trước số lần lặp?', answer: 'for', points: 10 },
    { id: 'r1-14', content: 'Vòng lặp nào chạy khi điều kiện còn đúng?', answer: 'while', points: 10 },
    { id: 'r1-15', content: 'Cấu trúc rẽ nhánh bắt đầu bằng từ khóa gì?', answer: 'if', points: 10 },

    // ... (Thêm các câu hỏi khác vào đây để đủ 50 câu) ...
    { id: 'r1-16', content: 'List được bao quanh bởi dấu ngoặc gì?', answer: '[] (Ngoặc vuông)', points: 10 },
    { id: 'r1-17', content: 'Chỉ số (index) đầu tiên của chuỗi là mấy?', answer: '0', points: 10 },
    { id: 'r1-18', content: 'Phép toán so sánh bằng trong Python viết thế nào?', answer: '==', points: 10 },
    { id: 'r1-19', content: 'Thư viện vẽ hình rùa trong Python tên là gì?', answer: 'turtle', points: 10 },
    { id: 'r1-20', content: 'Từ khóa dùng để trả về giá trị trong hàm?', answer: 'return', points: 10 },
];

// ROUND 2: OBSTACLE (VƯỢT CHƯỚNG NGẠI VẬT) - Target: 40 Questions
// Chia đều 4 dạng: LOGIC, SYNTAX, ALGO, OUTPUT (Mỗi dạng 10 câu)

const R2_LOGIC: Question[] = [
    { id: 'r2-logic-1', category: 'LOGIC', points: 30, content: 'Toán tử Logic', answer: 'False', codeSnippet: 'A = True\nB = False\nprint(A and B)' },
    { id: 'r2-logic-2', category: 'LOGIC', points: 30, content: 'Toán tử Logic', answer: 'True', codeSnippet: 'x = 5\nprint(x > 3 or x < 0)' },
    { id: 'r2-logic-3', category: 'LOGIC', points: 30, content: 'Toán tử Logic', answer: 'False', codeSnippet: 'val = True\nprint(not val)' },
    // ... Thêm 7 câu logic ...
];

const R2_SYNTAX: Question[] = [
    { id: 'r2-syn-1', category: 'SYNTAX', points: 40, content: 'Tìm lỗi sai', answer: 'Tên biến không được bắt đầu bằng số', codeSnippet: '1_score = 100\nprint(1_score)' },
    { id: 'r2-syn-2', category: 'SYNTAX', points: 40, content: 'Tìm lỗi sai', answer: 'Thiếu dấu hai chấm (:)', codeSnippet: 'if x > 5\n    print("Lon hon")' },
    { id: 'r2-syn-3', category: 'SYNTAX', points: 40, content: 'Tìm lỗi sai', answer: 'Sai thụt đầu dòng (Indentation)', codeSnippet: 'def hello():\nprint("Hi")' },
    // ... Thêm 7 câu syntax ...
];

const R2_ALGO: Question[] = [
    { id: 'r2-algo-1', category: 'ALGO', points: 50, content: 'Sắp xếp thuật toán', answer: 'B-A-C', codeSnippet: '# Mục tiêu: Tính tổng 2 số\n# (A) total = a + b\n# (B) a = 5, b = 10\n# (C) print(total)' },
    { id: 'r2-algo-2', category: 'ALGO', points: 50, content: 'Sắp xếp thuật toán', answer: 'A-C-B', codeSnippet: '# Mục tiêu: Vòng lặp in 0->2\n# (A) for i in range(3):\n# (B)    print("End")\n# (C)    print(i)' },
    { id: 'r2-algo-3', category: 'ALGO', points: 50, content: 'Sắp xếp thuật toán', answer: 'B-C-A', codeSnippet: '# Mục tiêu: Nhập và in tên\n# (A) print("Hello", name)\n# (B) name = ""\n# (C) name = input("Name?")' },
    // ... Thêm 7 câu algo ...
];

const R2_OUTPUT: Question[] = [
    { id: 'r2-out-1', category: 'OUTPUT', points: 40, content: 'Dự đoán Output', answer: '0\n1\n2', codeSnippet: 'for i in range(3):\n    print(i)' },
    { id: 'r2-out-2', category: 'OUTPUT', points: 40, content: 'Dự đoán Output', answer: 'HelloHello', codeSnippet: 's = "Hello"\nprint(s * 2)' },
    { id: 'r2-out-3', category: 'OUTPUT', points: 40, content: 'Dự đoán Output', answer: '15', codeSnippet: 'x = 10\nx = x + 5\nprint(x)' },
    // ... Thêm 7 câu output ...
];

export const ROUND_2_QUESTIONS: Question[] = [
    ...R2_LOGIC, ...R2_SYNTAX, ...R2_ALGO, ...R2_OUTPUT
];


// ROUND 3: FINISH LINE (VỀ ĐÍCH) - Target: 90 Questions
// Chia đều 3 độ khó: EASY (30), MEDIUM (30), HARD (30)

const R3_EASY: Question[] = [
    { id: 'r3-e1', difficulty: 'EASY', points: 20, content: 'Tên hàm dùng để in dữ liệu?', answer: 'print()' },
    { id: 'r3-e2', difficulty: 'EASY', points: 20, content: 'Phép chia lấy dư dùng ký hiệu gì?', answer: '%' },
    { id: 'r3-e3', difficulty: 'EASY', points: 20, content: 'Muốn nhập dữ liệu từ bàn phím dùng hàm gì?', answer: 'input()' },
    { id: 'r3-e4', difficulty: 'EASY', points: 20, content: 'Danh sách rỗng ký hiệu thế nào?', answer: '[]' },
    { id: 'r3-e5', difficulty: 'EASY', points: 20, content: 'Số nguyên trong tiếng Anh gọi là gì?', answer: 'Integer (int)' },
    // ... Copy thêm 25 câu EASY ...
];

const R3_MEDIUM: Question[] = [
    { id: 'r3-m1', difficulty: 'MEDIUM', points: 30, content: 'Làm sao thêm phần tử vào cuối List?', answer: '.append()' },
    { id: 'r3-m2', difficulty: 'MEDIUM', points: 30, content: 'Range(5) tạo ra các số nào?', answer: '0, 1, 2, 3, 4' },
    { id: 'r3-m3', difficulty: 'MEDIUM', points: 30, content: 'Lệnh nào thoát khỏi vòng lặp ngay lập tức?', answer: 'break' },
    { id: 'r3-m4', difficulty: 'MEDIUM', points: 30, content: 'Làm sao để lấy phần tử cuối cùng của List?', answer: 'list[-1]' },
    { id: 'r3-m5', difficulty: 'MEDIUM', points: 30, content: 'Hàm len("Hello") trả về bao nhiêu?', answer: '5' },
    // ... Copy thêm 25 câu MEDIUM ...
];

const R3_HARD: Question[] = [
    { id: 'r3-h1', difficulty: 'HARD', points: 40, content: 'Viết hàm kiểm tra số chẵn?', answer: 'def check(n): return n % 2 == 0' },
    { id: 'r3-h2', difficulty: 'HARD', points: 40, content: 'Thuật toán Hoán đổi giá trị 2 biến?', answer: 'temp = a; a = b; b = temp' },
    { id: 'r3-h3', difficulty: 'HARD', points: 40, content: 'Vòng lặp vô hạn viết như thế nào?', answer: 'while True:' },
    { id: 'r3-h4', difficulty: 'HARD', points: 40, content: 'Cách khai báo chuỗi nhiều dòng?', answer: 'Dùng 3 dấu nháy đơn hoặc kép' },
    { id: 'r3-h5', difficulty: 'HARD', points: 40, content: 'Sự khác biệt giữa List và Tuple?', answer: 'List thay đổi được, Tuple thì không' },
    // ... Copy thêm 25 câu HARD ...
];

export const ROUND_3_QUESTIONS: Question[] = [
    ...R3_EASY, ...R3_MEDIUM, ...R3_HARD
];

export const STORAGE_KEY = 'coding-showdown-state';

export const SOUND_EFFECTS = {
    // Google Actions Sound Library (Reliable & HTTPS)
    CORRECT: 'https://actions.google.com/sounds/v1/science_fiction/bell_ping.ogg',
    WRONG: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
    SCORE_UP: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg',
    SCORE_DOWN: 'https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg',
    VICTORY: 'https://actions.google.com/sounds/v1/crowds/female_cheer.ogg',
    BUZZ: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
};
