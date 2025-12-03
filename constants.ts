import { Question } from "./types";

export const ROUND_1_QUESTIONS: Question[] = [
    { id: 'r1-1', content: 'HTML là viết tắt của gì?', answer: 'HyperText Markup Language', points: 10 },
    { id: 'r1-2', content: 'Thẻ nào dùng để xuống dòng?', answer: '<br>', points: 10 },
    { id: 'r1-3', content: 'Biến const có thay đổi được không?', answer: 'Không', points: 10 },
    { id: 'r1-4', content: 'Index của mảng bắt đầu từ số mấy?', answer: '0', points: 10 },
    { id: 'r1-5', content: 'CSS dùng để làm gì?', answer: 'Trang trí/Style web', points: 10 },
    { id: 'r1-6', content: 'Hàm alert() làm gì?', answer: 'Hiện thông báo', points: 10 },
    { id: 'r1-7', content: 'Toán tử === khác == ở đâu?', answer: 'So sánh cả kiểu dữ liệu', points: 10 },
    { id: 'r1-8', content: 'DOM là gì?', answer: 'Document Object Model', points: 10 },
    { id: 'r1-9', content: 'React là Library hay Framework?', answer: 'Library', points: 10 },
    { id: 'r1-10', content: 'Thẻ <a> dùng để làm gì?', answer: 'Tạo liên kết', points: 10 },
];

export const ROUND_2_CHALLENGE: Question = {
    id: 'r2-main',
    content: 'Sắp xếp đoạn code sau để in ra "Hello World" 5 lần:',
    codeSnippet: `
    // Đang bị lộn xộn:
    }
    console.log("Hello World");
    for (let i = 0; i < 5; i++) {
    `,
    answer: `for (let i = 0; i < 5; i++) {\n  console.log("Hello World");\n}`,
    points: 50
};

export const ROUND_3_QUESTIONS: Question[] = [
    // EASY
    { id: 'r3-e1', content: 'Làm sao để chọn phần tử có id="demo"?', answer: 'document.getElementById("demo")', difficulty: 'EASY', points: 20 },
    { id: 'r3-e2', content: 'Khai báo biến nào không thể gán lại giá trị?', answer: 'const', difficulty: 'EASY', points: 20 },
    { id: 'r3-e3', content: 'Phương thức nào chuyển mảng thành chuỗi?', answer: 'join() hoặc toString()', difficulty: 'EASY', points: 20 },
    { id: 'r3-e4', content: 'Sự kiện click chuột trong React tên là gì?', answer: 'onClick', difficulty: 'EASY', points: 20 },
    
    // MEDIUM
    { id: 'r3-m1', content: 'useEffect chạy khi nào nếu dependency là []?', answer: 'Chỉ chạy 1 lần sau khi mount', difficulty: 'MEDIUM', points: 30 },
    { id: 'r3-m2', content: 'Phân biệt map() và forEach()?', answer: 'map trả về mảng mới, forEach thì không', difficulty: 'MEDIUM', points: 30 },
    { id: 'r3-m3', content: 'Local Storage lưu dữ liệu dạng gì?', answer: 'String (Chuỗi)', difficulty: 'MEDIUM', points: 30 },
    
    // HARD
    { id: 'r3-h1', content: 'Closure trong JS là gì?', answer: 'Hàm con nhớ scope của hàm cha ngay cả khi hàm cha đã chạy xong', difficulty: 'HARD', points: 40 },
    { id: 'r3-h2', content: 'Event Loop là gì?', answer: 'Cơ chế xử lý bất đồng bộ, đẩy task từ Queue vào Stack', difficulty: 'HARD', points: 40 },
    { id: 'r3-h3', content: 'useMemo dùng để làm gì?', answer: 'Cache kết quả tính toán để tránh tính lại không cần thiết', difficulty: 'HARD', points: 40 },
];

export const STORAGE_KEY = 'coding-showdown-state';

export const SOUND_EFFECTS = {
    CORRECT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Success chime
    WRONG: 'https://assets.mixkit.co/active_storage/sfx/949/949-preview.mp3', // Negative buzzer
    SCORE_UP: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Coin sound
    SCORE_DOWN: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // Slide down
    VICTORY: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Applause/Cheer
    BUZZ: 'https://assets.mixkit.co/active_storage/sfx/1602/1602-preview.mp3' // Emergency Alert type
};