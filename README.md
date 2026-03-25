# 🎵 Music Recognition App (SongID)

Ứng dụng nhận diện tên bài nhạc từ lời thoại người dùng, sử dụng công nghệ Speech-to-Text tiên tiến để tìm kiếm bài hát một cách thông minh và chính xác.

---

##  Tính năng chính (Functional Requirements)

Hệ thống được thiết kế để đáp ứng đầy đủ các yêu cầu nghiệp vụ sau:

* **Khởi động & Giao diện (FR-01):** Cho phép người dùng truy cập màn hình chính với các nút điều khiển trực quan.
* **Ghi âm bài nhạc (FR-02):** Thu âm lời bài hát bất kỳ từ microphone của thiết bị.
* **Chuyển đổi Speech-to-Text (FR-03):** Tự động chuyển đổi lời bài nhạc đã ghi âm thành văn bản để người dùng kiểm tra.
* **Phân tích lời bài hát (FR-04):** Loại bỏ các từ dư thừa (à, ờ...), ký tự không cần thiết và chuẩn hóa khoảng trắng để tối ưu hóa dữ liệu.
* **Tìm kiếm thông minh (FR-05):** So khớp lời bài hát với cơ sở dữ liệu hoặc API, hỗ trợ tìm kiếm mờ không yêu cầu chính xác 100%.
* **Hiển thị kết quả (FR-06):** Hiển thị chi tiết Tên bài hát, Ca sĩ và một phần lời tương ứng.
* **Xử lý lỗi (FR-07):** Thông báo rõ ràng khi không phát hiện được bài nhạc hoặc lời thoại không rõ ràng.
* **Điều khiển tìm kiếm (FR-08):** Cho phép xóa kết quả cũ hoặc thực hiện tìm kiếm lại ngay lập tức.
* **Lịch sử & Đa ngôn ngữ (FR-09, FR-10):** Lưu trữ lịch sử tìm kiếm cục bộ và hỗ trợ nhận diện qua nhiều ngôn ngữ khác nhau.
* **Nghe thử bài hát (FR-11):** Cho phép phát đoạn nhạc mẫu của bài hát sau khi tìm kiếm thành công.
* **Thoát ứng dụng (FR-12):** Đảm bảo thoát ứng dụng an toàn mà không làm mất dữ liệu.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

* **Frontend:** React Native (Expo)
* **Backend:** FastAPI (Python 3.10+)
* **Core AI & Recognition Engine (Nhận diện & AI):**  

ACRCloud API: Thuật toán Audio Fingerprinting để nhận diện nhạc gốc (nhạc phát từ loa) với tốc độ cao.

Groq Cloud API (Fallback System):

    Whisper-large-v3: Mô hình STT (Speech-to-Text) bóc băng lời hát chay siêu tốc độ.

    Llama-3.3-70b: Mô hình LLM suy luận, "dịch" lời hát chay thành tên bài hát chuẩn xác.
* **XExternal Data APIs:** 
    iTunes Search API: Truy xuất metadata bài hát (Ảnh bìa nét cao, Tên bài, Ca sĩ).

    LRCLIB API: Truy xuất kho lời bài hát đồng bộ (Full Lyrics) cho nhánh nhạc gốc.
* **Lưu trữ:** AsyncStorage (Local)

---


##  Hướng dẫn sử dụng (User Guide)

Để đạt được hiệu quả nhận diện tốt nhất, vui lòng thực hiện theo các bước sau:

##  Hướng dẫn cài đặt và chạy trên máy tính mới

### 1. Khởi động Backend
Mở terminal, di chuyển vào thư mục `backend`:

cd backend
 ### Tạo môi trường ảo và cài đặt thư viện:

Bash
python -m venv venv
# Kích hoạt venv (Windows): venv\Scripts\activate
# Kích hoạt venv (Mac/Linux): source venv/bin/activate

pip install -r requirements.txt
### Cấu hình biến môi trường (CỰC KỲ QUAN TRỌNG):
### Tạo một file tên là .env nằm trong thư mục backend, sau đó dán các API Key của bạn vào theo định dạng sau:

### Đoạn mã
ACRCLOUD_HOST=your_acrcloud_host
ACRCLOUD_ACCESS_KEY=your_acrcloud_access_key
ACRCLOUD_ACCESS_SECRET=your_acrcloud_secret_key
GROQ_API_KEY=your_groq_api_key
### Chạy Server:

Bash
uvicorn main:app --reload
2. Khởi động Frontend
Mở một terminal MỚI, di chuyển vào thư mục frontend:

Bash
cd frontend
npm install
npm run dev