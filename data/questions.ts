import { Question } from "../types";

// ============================================================================
// DATA STORAGE NOTE:
// Giáo viên có thể chỉnh sửa trực tiếp nội dung ở đây.
// ============================================================================

// ROUND 1: REFLEX (VẤN ĐÁP/TRỰC TIẾP)
export const ROUND_1_QUESTIONS: Question[] = [
    // --- EASY ---
    { id: 'r1-1', difficulty: 'EASY', content: 'Từ khóa nào dùng để khai báo hàm trong Python?', answer: 'def', points: 10 },
    { id: 'r1-2', difficulty: 'EASY', content: 'Input() trả về kiểu dữ liệu gì?', answer: 'String (str)', points: 10 },
    { id: 'r1-6', difficulty: 'EASY', content: '5 // 2 bằng bao nhiêu?', answer: '2', points: 10 },
    { id: 'r1-11', difficulty: 'EASY', content: 'Lệnh nào dùng để in ra màn hình?', answer: 'print()', points: 10 },
    { id: 'r1-16', difficulty: 'EASY', content: 'List được bao quanh bởi dấu ngoặc gì?', answer: '[] (Ngoặc vuông)', points: 10 },
    { id: 'r1-17', difficulty: 'EASY', content: 'Chỉ số (index) đầu tiên của chuỗi là mấy?', answer: '0', points: 10 },

    // --- MEDIUM ---
    { id: 'r1-3', difficulty: 'MEDIUM', content: 'Hàm nào dùng để tính độ dài của danh sách?', answer: 'len()', points: 15 },
    { id: 'r1-4', difficulty: 'MEDIUM', content: 'Để chuyển chuỗi thành số nguyên, dùng hàm gì?', answer: 'int()', points: 15 },
    { id: 'r1-5', difficulty: 'MEDIUM', content: 'True và False thuộc kiểu dữ liệu nào?', answer: 'Boolean (bool)', points: 15 },
    { id: 'r1-7', difficulty: 'MEDIUM', content: '5 % 2 bằng bao nhiêu?', answer: '1', points: 15 },
    { id: 'r1-12', difficulty: 'MEDIUM', content: 'Ký hiệu nào dùng để comment?', answer: '#', points: 15 },
    { id: 'r1-13', difficulty: 'MEDIUM', content: 'Vòng lặp nào dùng khi biết trước số lần lặp?', answer: 'for', points: 15 },
    { id: 'r1-15', difficulty: 'MEDIUM', content: 'Cấu trúc rẽ nhánh bắt đầu bằng từ khóa gì?', answer: 'if', points: 15 },
    { id: 'r1-18', difficulty: 'MEDIUM', content: 'Phép toán so sánh bằng trong Python viết thế nào?', answer: '==', points: 15 },

    // --- HARD ---
    { id: 'r1-8', difficulty: 'HARD', content: '2 ** 3 bằng bao nhiêu?', answer: '8', points: 20 },
    { id: 'r1-9', difficulty: 'HARD', content: '10 != 10 trả về True hay False?', answer: 'False', points: 20 },
    { id: 'r1-10', difficulty: 'HARD', content: 'not True là gì?', answer: 'False', points: 20 },
    { id: 'r1-14', difficulty: 'HARD', content: 'Vòng lặp nào chạy khi điều kiện còn đúng?', answer: 'while', points: 20 },
    { id: 'r1-19', difficulty: 'HARD', content: 'Thư viện vẽ hình rùa trong Python tên là gì?', answer: 'turtle', points: 20 },
    { id: 'r1-20', difficulty: 'HARD', content: 'Từ khóa dùng để trả về giá trị trong hàm?', answer: 'return', points: 20 },
];

// ROUND 2: OBSTACLE (VƯỢT CHƯỚNG NGẠI VẬT)
const R2_LOGIC: Question[] = [
    { id: 'r2-logic-1', difficulty: 'EASY', category: 'LOGIC', points: 30, content: 'Toán tử Logic', answer: 'False', codeSnippet: 'A = True\nB = False\nprint(A and B)' },
    { id: 'r2-logic-2', difficulty: 'MEDIUM', category: 'LOGIC', points: 40, content: 'Toán tử Logic', answer: 'True', codeSnippet: 'x = 5\nprint(x > 3 or x < 0)' },
    { id: 'r2-logic-3', difficulty: 'HARD', category: 'LOGIC', points: 50, content: 'Toán tử Logic', answer: 'False', codeSnippet: 'val = True\nprint(not val)' },
];

const R2_SYNTAX: Question[] = [
    { id: 'r2-syn-1', difficulty: 'EASY', category: 'SYNTAX', points: 30, content: 'Tìm lỗi sai', answer: 'Tên biến không được bắt đầu bằng số', codeSnippet: '1_score = 100\nprint(1_score)' },
    { id: 'r2-syn-2', difficulty: 'MEDIUM', category: 'SYNTAX', points: 40, content: 'Tìm lỗi sai', answer: 'Thiếu dấu hai chấm (:)', codeSnippet: 'if x > 5\n    print("Lon hon")' },
    { id: 'r2-syn-3', difficulty: 'HARD', category: 'SYNTAX', points: 50, content: 'Tìm lỗi sai', answer: 'Sai thụt đầu dòng (Indentation)', codeSnippet: 'def hello():\nprint("Hi")' },
];

const R2_ALGO: Question[] = [
    { id: 'r2-algo-1', difficulty: 'EASY', category: 'ALGO', points: 30, content: 'Sắp xếp thuật toán', answer: 'B-A-C', codeSnippet: '# Mục tiêu: Tính tổng 2 số\n# (A) total = a + b\n# (B) a = 5, b = 10\n# (C) print(total)' },
    { id: 'r2-algo-2', difficulty: 'MEDIUM', category: 'ALGO', points: 40, content: 'Sắp xếp thuật toán', answer: 'A-C-B', codeSnippet: '# Mục tiêu: Vòng lặp in 0->2\n# (A) for i in range(3):\n# (B)    print("End")\n# (C)    print(i)' },
    { id: 'r2-algo-3', difficulty: 'HARD', category: 'ALGO', points: 50, content: 'Sắp xếp thuật toán', answer: 'B-C-A', codeSnippet: '# Mục tiêu: Nhập và in tên\n# (A) print("Hello", name)\n# (B) name = ""\n# (C) name = input("Name?")' },
];

const R2_OUTPUT: Question[] = [
    { id: 'r2-out-1', difficulty: 'EASY', category: 'OUTPUT', points: 30, content: 'Dự đoán Output', answer: '0\n1\n2', codeSnippet: 'for i in range(3):\n    print(i)' },
    { id: 'r2-out-2', difficulty: 'MEDIUM', category: 'OUTPUT', points: 40, content: 'Dự đoán Output', answer: 'HelloHello', codeSnippet: 's = "Hello"\nprint(s * 2)' },
    { id: 'r2-out-3', difficulty: 'HARD', category: 'OUTPUT', points: 50, content: 'Dự đoán Output', answer: '15', codeSnippet: 'x = 10\nx = x + 5\nprint(x)' },
];

export const ROUND_2_QUESTIONS: Question[] = [
    ...R2_LOGIC, ...R2_SYNTAX, ...R2_ALGO, ...R2_OUTPUT
];

// ROUND 3: FINISH LINE (VỀ ĐÍCH)
// Target: 45 Questions (15 per level)

const R3_EASY: Question[] = [
    { id: 'r3-e1', difficulty: 'EASY', points: 20, content: 'Tên hàm dùng để in dữ liệu?', answer: 'print()' },
    { id: 'r3-e2', difficulty: 'EASY', points: 20, content: 'Phép chia lấy dư dùng ký hiệu gì?', answer: '%' },
    { id: 'r3-e3', difficulty: 'EASY', points: 20, content: 'Muốn nhập dữ liệu từ bàn phím dùng hàm gì?', answer: 'input()' },
    { id: 'r3-e4', difficulty: 'EASY', points: 20, content: 'Danh sách rỗng ký hiệu thế nào?', answer: '[]' },
    { id: 'r3-e5', difficulty: 'EASY', points: 20, content: 'Số nguyên trong tiếng Anh gọi là gì?', answer: 'Integer (int)' },
    { id: 'r3-e6', difficulty: 'EASY', points: 20, content: 'Kết quả của "5" + "5" là gì?', answer: '"55" (Chuỗi)' },
    { id: 'r3-e7', difficulty: 'EASY', content: 'Dấu # dùng để làm gì?', answer: 'Comment (Ghi chú)', points: 20 },
    { id: 'r3-e8', difficulty: 'EASY', content: 'Hàm int("10") trả về gì?', answer: 'Số 10 (Integer)', points: 20 },
    { id: 'r3-e9', difficulty: 'EASY', content: 'True và False là kiểu dữ liệu gì?', answer: 'Boolean', points: 20 },
    { id: 'r3-e10', difficulty: 'EASY', content: 'Phép toán 10 - 5 bằng mấy?', answer: '5', points: 20 },
    { id: 'r3-e11', difficulty: 'EASY', content: 'Ký tự xuống dòng là gì?', answer: '\\n', points: 20 },
    { id: 'r3-e12', difficulty: 'EASY', content: 'Hàm nào dùng để tạo 1 dãy số?', answer: 'range()', points: 20 },
    { id: 'r3-e13', difficulty: 'EASY', content: 'Phép nhân dùng ký hiệu gì?', answer: '*', points: 20 },
    { id: 'r3-e14', difficulty: 'EASY', content: 'Biến name = "Nam" là kiểu gì?', answer: 'String', points: 20 },
    { id: 'r3-e15', difficulty: 'EASY', content: 'Lệnh import dùng để làm gì?', answer: 'Thêm thư viện', points: 20 },
];

const R3_MEDIUM: Question[] = [
    { id: 'r3-m1', difficulty: 'MEDIUM', points: 30, content: 'Làm sao thêm phần tử vào cuối List?', answer: '.append()' },
    { id: 'r3-m2', difficulty: 'MEDIUM', points: 30, content: 'Range(5) tạo ra các số nào?', answer: '0, 1, 2, 3, 4' },
    { id: 'r3-m3', difficulty: 'MEDIUM', points: 30, content: 'Lệnh nào thoát khỏi vòng lặp ngay lập tức?', answer: 'break' },
    { id: 'r3-m4', difficulty: 'MEDIUM', points: 30, content: 'Làm sao để lấy phần tử cuối cùng của List?', answer: 'list[-1]' },
    { id: 'r3-m5', difficulty: 'MEDIUM', points: 30, content: 'Hàm len("Hello") trả về bao nhiêu?', answer: '5' },
    { id: 'r3-m6', difficulty: 'MEDIUM', content: 'Hàm str(100) trả về gì?', answer: '"100" (Chuỗi)', points: 30 },
    { id: 'r3-m7', difficulty: 'MEDIUM', content: 'Lệnh continue dùng để làm gì?', answer: 'Bỏ qua lần lặp hiện tại', points: 30 },
    { id: 'r3-m8', difficulty: 'MEDIUM', content: 'Cách viết hoa toàn bộ chuỗi s?', answer: 's.upper()', points: 30 },
    { id: 'r3-m9', difficulty: 'MEDIUM', content: 'Xóa phần tử tại vị trí i trong List?', answer: 'pop(i) hoặc del', points: 30 },
    { id: 'r3-m10', difficulty: 'MEDIUM', content: 'Toán tử nào kiểm tra phần tử có trong List?', answer: 'in', points: 30 },
    { id: 'r3-m11', difficulty: 'MEDIUM', content: 'Hàm nào tìm giá trị lớn nhất trong List?', answer: 'max()', points: 30 },
    { id: 'r3-m12', difficulty: 'MEDIUM', content: 'if a > 0 and b > 0: nghĩa là gì?', answer: 'Cả a và b đều dương', points: 30 },
    { id: 'r3-m13', difficulty: 'MEDIUM', content: 'Để nối 2 chuỗi lại với nhau dùng toán tử gì?', answer: '+', points: 30 },
    { id: 'r3-m14', difficulty: 'MEDIUM', content: 'Cách lấy 3 ký tự đầu của chuỗi s?', answer: 's[0:3]', points: 30 },
    { id: 'r3-m15', difficulty: 'MEDIUM', content: 'Hàm input() luôn trả về kiểu gì?', answer: 'String', points: 30 },
];

const R3_HARD: Question[] = [
    { id: 'r3-h1', difficulty: 'HARD', points: 40, content: 'Viết hàm kiểm tra số chẵn?', answer: 'def check(n): return n % 2 == 0' },
    { id: 'r3-h2', difficulty: 'HARD', points: 40, content: 'Thuật toán Hoán đổi giá trị 2 biến?', answer: 'temp = a; a = b; b = temp' },
    { id: 'r3-h3', difficulty: 'HARD', points: 40, content: 'Vòng lặp vô hạn viết như thế nào?', answer: 'while True:' },
    { id: 'r3-h4', difficulty: 'HARD', points: 40, content: 'Cách khai báo chuỗi nhiều dòng?', answer: 'Dùng 3 dấu nháy đơn hoặc kép' },
    { id: 'r3-h5', difficulty: 'HARD', points: 40, content: 'Sự khác biệt giữa List và Tuple?', answer: 'List thay đổi được, Tuple thì không' },
    { id: 'r3-h6', difficulty: 'HARD', content: 'Biến cục bộ (local variable) là gì?', answer: 'Biến khai báo trong hàm', points: 40 },
    { id: 'r3-h7', difficulty: 'HARD', content: 'Làm sao để import tất cả từ thư viện math?', answer: 'from math import *', points: 40 },
    { id: 'r3-h8', difficulty: 'HARD', content: 'Hàm nào dùng để sắp xếp List?', answer: 'sort() hoặc sorted()', points: 40 },
    { id: 'r3-h9', difficulty: 'HARD', content: 'Dictionary lưu dữ liệu dưới dạng nào?', answer: 'Key - Value', points: 40 },
    { id: 'r3-h10', difficulty: 'HARD', content: 'Làm sao để ép kiểu dữ liệu?', answer: 'Dùng hàm int(), float(), str()...', points: 40 },
    { id: 'r3-h11', difficulty: 'HARD', content: 'Toán tử // khác / ở chỗ nào?', answer: '// chia lấy nguyên, / chia thường', points: 40 },
    { id: 'r3-h12', difficulty: 'HARD', content: 'Try...Except dùng để làm gì?', answer: 'Xử lý ngoại lệ (lỗi)', points: 40 },
    { id: 'r3-h13', difficulty: 'HARD', content: 'File mode "w" có ý nghĩa gì?', answer: 'Ghi đè (Write)', points: 40 },
    { id: 'r3-h14', difficulty: 'HARD', content: 'Đệ quy là gì?', answer: 'Hàm tự gọi lại chính nó', points: 40 },
    { id: 'r3-h15', difficulty: 'HARD', content: 'Lambda function là gì?', answer: 'Hàm vô danh (Anonymous function)', points: 40 },
];

export const ROUND_3_QUESTIONS: Question[] = [
    ...R3_EASY, ...R3_MEDIUM, ...R3_HARD
];