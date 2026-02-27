# 🎮 CODING SHOWDOWN ARENA — LOGIC TRÒ CHƠI

> **Tổng điểm chuẩn: 500 điểm**  
> Tài liệu dành cho giáo viên — Phiên bản cập nhật: 27/02/2026

---

## 📊 TỔNG QUAN

| Vòng | Tên | Tỷ lệ | Điểm tối đa | Hình thức |
|------|-----|--------|-------------|-----------|
| **Vòng 1** | Reflex Quiz (Khởi Động) | 30% | **150đ** | Vấn đáp nhanh |
| **Vòng 2** | Obstacle (Vượt Chướng Ngại Vật) | 30% | **150đ** + Bonus | Debug code |
| **Vòng 3** | Tactical Finish (Về Đích) | 40% | **240đ** (max) | Chọn gói câu hỏi |
| | | | **500đ chuẩn** | |

---

## 🔵 VÒNG 1: REFLEX QUIZ — Khởi Động

### Mô tả
Giáo viên chọn học viên và câu hỏi. Học viên bấm buzz xác nhận sẵn sàng, trả lời miệng. Giáo viên chấm điểm.

### Flow

```
1. 👨‍🏫 Teacher chọn học viên
2. 👨‍🏫 Teacher chọn câu hỏi (EASY / MEDIUM)
3. 🖐️ Học viên buzz in (xác nhận)
4. 👨‍🏫 Teacher grade:
   ✅ CORRECT → Cộng điểm
   ❌ WRONG  → 0đ (không trừ điểm)
5. 🔄 Lặp lại cho học viên khác
```

### Bảng điểm

Điểm cộng khi đúng **phụ thuộc vào số lượng học viên trong lớp**:

| Số học viên | Điểm ĐÚNG / câu | Số câu tối đa | Tổng điểm max |
|-------------|-----------------|----------------|---------------|
| **≥ 10 học viên** | **+30đ** | 5 câu | **150đ** |
| **< 10 học viên** | **+15đ** | 10 câu | **150đ** |

| Kết quả | Điểm |
|---------|------|
| ✅ CORRECT (≥10 HS) | **+30đ** |
| ✅ CORRECT (<10 HS) | **+15đ** |
| ❌ WRONG | **0đ** (không trừ) |

### Lưu ý cho giáo viên
- Điểm cộng **tự động thay đổi** theo số lượng học viên tham gia
- Sai = **0đ**, không bị phạt ở vòng này
- Tổng điểm tối đa Vòng 1 luôn là **150đ** dù lớp đông hay ít

---

## 🟠 VÒNG 2: OBSTACLE — Vượt Chướng Ngại Vật

### Mô tả
Hệ thống tự động chọn 5 câu hỏi debugging. Giáo viên hiển thị câu hỏi, học viên viết code trả lời trên điện thoại và submit. Giáo viên xem code rồi chấm điểm từng bài.

### Flow

```
1. 🎲 Hệ thống auto chọn 5 câu hỏi random
2. 👨‍🏫 Teacher hiển thị câu hỏi lên màn hình lớn
3. ⌨️ Học viên viết code + bấm SUBMIT
4. 👨‍🏫 Teacher xem code từng HS → Grade: CORRECT / WRONG
5. ➡️ Chuyển sang câu tiếp theo
```

### Bảng điểm

| Kết quả | Điểm |
|---------|------|
| ✅ CORRECT | **+30đ** |
| ❌ WRONG | **0đ** (không trừ) |

**Tổng điểm cơ bản: 5 câu × 30đ = 150đ**

### 🏆 Speed Bonus — Thưởng nộp sớm

Mỗi câu hỏi, **Top 3 học viên nộp bài sớm nhất** sẽ được cộng thêm bonus:

| Hạng nộp sớm | Bonus | Tổng điểm nếu đúng |
|--------------|-------|---------------------|
| 🥇 Top 1 (nhanh nhất) | **+6đ** | 30 + 6 = **36đ** |
| 🥈 Top 2 | **+4đ** | 30 + 4 = **34đ** |
| 🥉 Top 3 | **+2đ** | 30 + 2 = **32đ** |
| Còn lại | +0đ | **30đ** |

> ⚡ Speed Bonus áp dụng **cho mỗi câu** (5 câu). Bonus chỉ cộng khi trả lời **ĐÚNG**.

### Ví dụ minh họa

**Câu 1:** 3 bạn nộp sớm nhất đều trả lời đúng:
- Kiet (3.2s): 30 + 6 = **36đ** 🥇
- Hieu (5.1s): 30 + 4 = **34đ** 🥈
- Lan (7.4s): 30 + 2 = **32đ** 🥉
- An (12s): **30đ**
- Minh (15s, sai): **0đ**

**Tương tự cho câu 2, 3, 4, 5.**

### Điểm tối đa

| | Base | Max Bonus | Tổng |
|---|---|---|---|
| Mỗi câu | 30đ | +6đ | 36đ |
| 5 câu (Top 1 cả 5) | 150đ | +30đ | **180đ** |
| 5 câu (không bonus) | 150đ | 0đ | **150đ** |

### Lưu ý cho giáo viên
- Sai = **0đ**, không bị trừ điểm ở vòng này
- Speed Bonus khuyến khích HS làm nhanh và chính xác
- Bonus chỉ tính cho HS trả lời **ĐÚNG** trong Top 3
- Hệ thống tự động tính thời gian và xếp hạng

---

## 🔴 VÒNG 3: TACTICAL FINISH — Về Đích

### Mô tả
Mỗi học viên tự chọn bộ 3 câu hỏi theo độ khó (EASY / MEDIUM / HARD). Giáo viên mở từng lượt cho học viên trả lời. Có 2 chế độ: **Vấn đáp (ORAL)** và **Trắc nghiệm (MCQ)**.

### Setup — Chọn gói câu hỏi

Mỗi học viên chọn **3 câu hỏi** từ các mức:

| Độ khó | Điểm đúng | Điểm sai | Ví dụ |
|--------|-----------|----------|-------|
| 🟢 EASY | **+40đ** | **-40đ** | Nhập tên và in "Xin chào" |
| 🟡 MEDIUM | **+60đ** | **-60đ** | In số chẵn 1–20 |
| 🔴 HARD | **+80đ** | **-80đ** | Kiểm tra số nguyên tố |

> **Sai = mất 100% điểm câu** (phạt bằng đúng số điểm cộng)

Học viên **tự do** chọn bất kỳ combo nào, ví dụ:
- An toàn: EASY + EASY + MEDIUM = max 140đ
- Cân bằng: EASY + MEDIUM + HARD = max 180đ
- Liều lĩnh: HARD + HARD + HARD = max **240đ** ✅ (được phép)

### Flow

```
1. 📝 Mỗi HS chọn 3 câu (EASY/MEDIUM/HARD) → Lock In
2. 👨‍🏫 Teacher chọn học viên mở lượt
3. 👨‍🏫 Teacher start câu hỏi (chế độ ORAL hoặc MCQ)
4. 🗣️ Học viên trả lời
5. 👨‍🏫 Teacher grade:
   ✅ CORRECT → Cộng điểm
   ❌ WRONG  → Trừ điểm → Tự động mở Steal
   ⏭️ SKIP   → 0đ → Tự động mở Steal sau 5 giây
6. 🔄 Tiếp tục câu tiếp trong bộ 3 câu
7. ✅ Hoàn thành 3 câu → Clear turn → Về chờ
```

### Ví dụ cụ thể

**Học viên "Hiếu"** chọn pack: `[MEDIUM, HARD, HARD]`

```
📝 Câu 1 (MEDIUM — 60đ):
   ❌ Trả lời: SAI
   💰 Điểm: -60đ
   📊 Status: 🔴 WRONG
   ⚡ Bắt đầu lượt Steal 15s
   ....
   ⏹️ Kết thúc Steal
   ➡️ Tiếp tục: Câu 2

📝 Câu 2 (HARD — 80đ):
   ❌ Trả lời: SAI
   💰 Điểm: -80đ (tổng: -140đ)
   📊 Status: 🔴 WRONG
   ⚡ Bắt đầu Steal 15s
   ....
   ⏹️ Kết thúc Steal
   ➡️ Tiếp tục: Câu 3

📝 Câu 3 (HARD — 80đ):
   ✅ Trả lời: ĐÚNG
   💰 Điểm: +80đ (tổng: -60đ)
   📊 Status: 🟢 CORRECT
   ✅ Hoàn thành: Clear turn → Về chờ

📊 Kết quả pack: 🔴🔴🟢
💰 Điểm Round 3: -60đ
💰 Điểm tổng: (R1 + R2) - 60đ
```

### ⚡ Steal — Cướp câu hỏi

Khi học viên trả lời **SAI** hoặc **SKIP**, các học viên khác có cơ hội **Steal** (cướp):

| Tình huống kích hoạt | Thời điểm mở Steal |
|----------------------|---------------------|
| ❌ WRONG | Mở **ngay lập tức**, kéo dài **15 giây** |
| ⏭️ SKIP | Mở **sau 5 giây**, kéo dài **15 giây** |

#### Cách Steal hoạt động:

```
1. 🔔 Học viên khác bấm BUZZ để giành quyền trả lời
2. 👨‍🏫 Teacher chọn 1 HS từ danh sách buzz (ưu tiên nhanh nhất)
3. 🗣️ HS steal trả lời
4. 👨‍🏫 Teacher grade:
   ✅ CORRECT → Cộng điểm cho HS steal → Kết thúc Steal
   ❌ WRONG  → Trừ điểm HS steal → Buzzer mở lại sau 5s cho HS khác
```

#### Điểm Steal:

| Kết quả | Điểm |
|---------|------|
| ✅ Steal ĐÚNG | **+điểm câu** (VD: câu HARD = +80đ) |
| ❌ Steal SAI | **-điểm câu** (VD: câu HARD = -80đ) |

> ⚠️ **Steal rất rủi ro!** Sai = mất toàn bộ điểm câu. Chỉ buzz khi chắc chắn.

### Chế độ Vấn đáp (ORAL) vs Trắc nghiệm (MCQ)

| | ORAL (Vấn đáp) | MCQ (Trắc nghiệm) |
|---|---|---|
| Cách trả lời | Trả lời miệng | Chọn A/B/C/D trên điện thoại |
| Chấm điểm | GV tích tay | Hệ thống tự chấm |
| Điểm đúng | +40/60/80đ | +40/60/80đ |
| Điểm sai | -40/60/80đ | -40/60/80đ |
| Steal | Có | Có |

> 📌 **Điểm giống nhau** giữa 2 chế độ. Chỉ khác hình thức trả lời và chấm.

### Timer Vòng 3

| Loại | EASY | MEDIUM | HARD |
|------|------|--------|------|
| ⏱️ Trả lời chính | 20s | 60s | 120s |
| ⚡ Steal Window | 15s | 15s | 15s |
| 🔄 Cooldown sau Steal sai | 5s | 5s | 5s |
| ⏳ Delay SKIP → Steal | 5s | 5s | 5s |

---

## 📊 BẢNG TỔNG HỢP ĐIỂM

### Điểm tối đa mỗi vòng

| Vòng | Base Max | Bonus Max | Tổng Max |
|------|----------|-----------|----------|
| **Vòng 1** | 150đ | — | **150đ** |
| **Vòng 2** | 150đ | +30đ (bonus) | **180đ** |
| **Vòng 3** | 240đ (3×HARD) | +steal | **240đ+** |
| **Tổng chuẩn** | | | **~500đ** |

### Bảng điểm nhanh

| Hành động | Điểm |
|-----------|------|
| R1: Đúng (≥10 HS) | **+30đ** |
| R1: Đúng (<10 HS) | **+15đ** |
| R1: Sai | **0đ** |
| R2: Đúng | **+30đ** |
| R2: Sai | **0đ** |
| R2: Speed Bonus Top 1/2/3 | **+6đ / +4đ / +2đ** |
| R3: Đúng EASY | **+40đ** |
| R3: Đúng MEDIUM | **+60đ** |
| R3: Đúng HARD | **+80đ** |
| R3: Sai (bất kỳ) | **-điểm câu** |
| R3: SKIP | **0đ** |
| R3: Steal đúng | **+điểm câu** |
| R3: Steal sai | **-điểm câu** |

### Quy tắc chung
- Điểm tối thiểu: **0đ** (không xuống âm)
- Giáo viên luôn có nút **chỉnh điểm thủ công** (+/-) cho trường hợp đặc biệt

---

## ❓ FAQ — Câu hỏi thường gặp

**Q: Học viên bấm SUBMIT muộn sau khi hết giờ ở Vòng 2?**  
A: Hệ thống sẽ ghi nhận thời gian thực tế. Giáo viên có quyền quyết định chấp nhận hay không.

**Q: Vòng 3 — Học viên có thể chọn 3 câu HARD không?**  
A: Có! Max = 3 × 80đ = 240đ. Nhưng rủi ro cao: 3 câu sai = -240đ.

**Q: Speed Bonus Vòng 2 có tính khi trả lời sai không?**  
A: Không. Bonus chỉ cộng khi trả lời **ĐÚNG** và nằm trong Top 3 nhanh nhất.

**Q: Steal sai thì chuyện gì xảy ra?**  
A: Trừ điểm câu, buzzer đóng 5 giây rồi mở lại cho học viên khác tiếp tục steal.

**Q: Điểm có thể xuống âm không?**  
A: Không. Điểm tối thiểu là 0đ.

---

*Tài liệu này mô tả logic thiết kế của trò chơi. Một số tính năng có thể đang trong quá trình phát triển.*
