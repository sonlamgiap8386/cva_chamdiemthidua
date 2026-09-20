<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Hệ thống thi đua CBVC – triển khai thực tế

## Chuẩn bị bắt buộc

1. Sao chép `.env.example` thành `.env.local` và điền cấu hình Firebase của môi trường triển khai. Không đưa `.env.local` lên Git.
2. Trong Firebase Authentication, bật Email/Password và tạo tài khoản cho từng CBVC theo đúng email trong bộ hồ sơ `users`.
3. Gán custom claims bằng Firebase Admin SDK: `role`, `staffId` (đúng ID document hồ sơ), và `departmentId` cho tổ trưởng. Không dùng trường do trình duyệt gửi để phân quyền. Sau khi đổi tổ trưởng, phải cập nhật claims và yêu cầu người dùng đăng nhập lại.
4. Nạp danh mục `users`, `departments` và dữ liệu ban đầu bằng tài khoản có claim `bgh`, sau đó triển khai quy tắc: `npx firebase-tools deploy --only firestore:rules`.

## Chạy và kiểm tra

```bash
npm ci
npm run lint
npm run build
```

Sau khi build, triển khai Hosting: `npx firebase-tools deploy --only hosting`.

## Triển khai từ GitHub

Workflow `.github/workflows/deploy-firebase.yml` tự kiểm tra và deploy khi đẩy lên nhánh `main`. Trước lần push đầu tiên, tạo GitHub Environment `production` và thêm các Secrets: `FIREBASE_SERVICE_ACCOUNT` (toàn bộ JSON của service account), `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_STORAGE_BUCKET`, và `VITE_FIREBASE_MESSAGING_SENDER_ID`.

Tệp service-account JSON bị chặn bởi `.gitignore`; tuyệt đối không commit tệp này hoặc `.env.local`. Tài khoản quản trị được giữ qua migration: hồ sơ có role `bgh` sẽ được tạo trong Firebase Authentication và nhận custom claim `bgh`.

## Chuyển tài khoản cũ sang Firebase Authentication

Nếu dự án cũ đã có bộ sưu tập `user_passwords`, tải service-account JSON của đúng Firebase project rồi chạy một lần:

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_PATH = 'C:\duong-dan\service-account.json'
npm run migrate:accounts
```

Lệnh giữ nguyên mật khẩu hiện tại, tạo Firebase Authentication account theo email CBVC và gán role. Hãy cho người dùng kiểm tra đăng nhập; chỉ khi đã xác nhận mới chạy lại lệnh với `-- --purge-legacy-passwords` để xóa mật khẩu dạng rõ cũ.

## Lưu ý vận hành

- Không lưu hoặc phân phối mật khẩu mặc định trong ứng dụng; dùng Firebase Authentication để đặt lại mật khẩu. Bản production không có chế độ đăng nhập dự phòng bằng localStorage.
- Firestore là nguồn dữ liệu duy nhất cho điểm thi đua. Sao lưu production phải dùng Firestore managed export (Cloud Scheduler/Cloud Storage hoặc quy trình quản trị), không dùng localStorage hay “snapshot” trong trình duyệt.
- Không thay đổi cấu hình Firebase từ giao diện; cấu hình được đóng gói từ biến `VITE_FIREBASE_*` khi build.

## Checklist phát hành

1. Thu hồi service-account cũ nếu từng nằm trên máy hoặc thư mục đồng bộ; không lưu JSON key trong thư mục dự án.
2. Chạy migration để gán `role`, `staffId`, `departmentId`, rồi deploy `firestore.rules`.
3. Kiểm thử bằng ít nhất bốn tài khoản: BGH, TTCM tổ A, TTCM tổ B và giáo viên; đặc biệt xác minh TTCM A không thể đọc/sửa điểm tổ B và không thể duyệt/khóa sổ.
4. Thiết lập Firestore managed export, cảnh báo chi phí và quy trình khôi phục đã được diễn tập.
