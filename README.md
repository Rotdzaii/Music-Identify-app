# 🎵 Music Recognition App (SongID)

Ứng dụng nhận diện tên bài nhạc từ lời thoại người dùng, sử dụng công nghệ Speech-to-Text tiên tiến để tìm kiếm bài hát một cách thông minh và chính xác.

---

## 🌟 Tính năng chính (Functional Requirements)

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
* **STT Engine:** WhisperX (tích hợp VAD để lọc tạp âm)
* **Xử lý âm thanh:** FFmpeg
* **Lưu trữ:** AsyncStorage (Local) & Music API (External)

---

## 📂 Cấu trúc dự án (Project Structure)


MUSICIDAPP/
├── app/                  # Screens & Điều hướng (Expo Router)
├── backend/              # Mã nguồn Server FastAPI
│   ├── main.py           # Entry point của Server
│   ├── app/services/     # Logic STT (WhisperX) và Tìm kiếm
│   ├── app/utils/        # Xử lý văn bản (FR-04)
│   └── uploads/          # Lưu trữ tạm file audio (.m4a)
├── components/           # UI Components tái sử dụng
├── constants/            # Theme, Màu sắc và Global Styles
├── hooks/                # Logic ghi âm và quản lý trạng thái
├── services/             # Client gọi API từ App lên Server
└── lib/                  # Các hàm tiện ích dùng chung

## 📖 Hướng dẫn sử dụng (User Guide)

Để đạt được hiệu quả nhận diện tốt nhất, vui lòng thực hiện theo các bước sau:

### 1. Khởi đầu & Thiết lập
* **Mở ứng dụng:** Hệ thống sẽ đưa bạn đến màn hình chính ngay khi khởi động[cite: 3].
* **Chọn ngôn ngữ:** Nhấn vào biểu tượng quả cầu hoặc danh sách ngôn ngữ để chọn ngôn ngữ phù hợp với bài hát bạn sắp đọc/hát (Ví dụ: Tiếng Việt, Tiếng Anh...)[cite: 57, 58].

### 2. Quá trình nhận diện bài hát
* **Bắt đầu ghi âm:** Nhấn nút **Record** trên màn hình chính để hệ thống bắt đầu ghi nhận âm thanh từ microphone[cite: 8, 10].
* **Kết thúc ghi âm:** * Bạn có thể chủ động nhấn nút **Stop** để kết thúc[cite: 9].
    * Hoặc hệ thống sẽ tự động dừng khi đã nhận diện đủ dữ liệu và tìm thấy danh sách bài nhạc phù hợp[cite: 9].
* **Kiểm tra lời thoại:** Sau khi dừng, văn bản lời bài hát được nhận diện (STT) sẽ hiển thị trên màn hình để bạn kiểm tra độ chính xác[cite: 13, 14].

### 3. Xem kết quả & Tương tác
* **Thông tin bài hát:** Nếu tìm thấy kết quả phù hợp, ứng dụng sẽ hiển thị:
    * Tên bài hát[cite: 30].
    * Tên ca sĩ (nếu có dữ liệu)[cite: 32].
    * Một phần lời bài hát tương ứng để đối chiếu[cite: 33].
* **Nghe thử:** Nếu kết quả hợp lệ, bạn có thể nhấn nút phát để nghe đoạn nhạc mẫu của bài hát đó[cite: 59, 61].
* **Tìm kiếm lại:** Bạn có thể nhấn nút **Retry** để thực hiện tìm kiếm lại ngay lập tức mà không cần thoát ứng dụng[cite: 47].
* **Xóa kết quả:** Sử dụng nút xóa để dọn dẹp kết quả tìm kiếm hiện tại trên màn hình[cite: 49].

### 4. Quản lý lịch sử & Hệ thống
* **Xem lịch sử:** Truy cập mục Lịch sử để xem lại các đoạn lời thoại đã nhận diện và các kết quả bài hát được tìm thấy trước đó[cite: 50, 53, 55].
* **Xử lý khi không có kết quả:** * Nếu hệ thống báo "Không tìm thấy bài hát phù hợp", hãy thử ghi âm lại với lời thoại rõ ràng hơn[cite: 34, 36, 43].
    * Đảm bảo microphone không bị che khuất và môi trường xung quanh không quá ồn[cite: 38, 40].
* **Thoát ứng dụng:** Bạn có thể thoát ứng dụng bất cứ lúc nào, hệ thống đảm bảo dữ liệu của bạn được bảo mật và không bị mất[cite: 63, 64].