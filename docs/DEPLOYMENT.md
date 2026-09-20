# Hướng dẫn đưa hệ thống vào chạy thực tế

## 1. Chuẩn bị Firebase (làm một lần)
1. Firebase Console → **Authentication** → bật phương thức *Email/Password*. Thêm tên miền hosting vào *Authorized domains*.
2. **Firestore Database** → tạo database (chế độ production).
3. Google Cloud Console → *APIs & Services → Credentials* → giới hạn **Web API key** theo *HTTP referrers* (chỉ tên miền của hệ thống).
4. Copy `.env.example` thành `.env.local` và điền các biến `VITE_FIREBASE_*` (lấy ở *Project settings → Your apps*). Kiểm tra lại `appId` là mã thật của ứng dụng Web (dạng `1:123…:web:abcd…`).
5. Tạo khóa dịch vụ: *Project settings → Service accounts → Generate new private key*. Lưu **ngoài thư mục dự án**; không commit, không gửi qua chat/email.

## 2. Khởi tạo tài khoản đầu tiên (BGH)
Luật bảo mật cấm trình duyệt tự tạo tài khoản/quyền, nên tài khoản đầu tiên tạo bằng script:
1. Trong Firestore tạo tay tài liệu `users/<id>` cho tài khoản BGH với các trường: `id, name, code, email, role: "bgh", departmentId, departmentName, position`.
2. Chạy (đặt biến môi trường trước):
   `FIREBASE_SERVICE_ACCOUNT_PATH=/duong/dan/service-account.json RESET_PASSWORD='<mật khẩu tạm>' npm run reset:passwords`
3. Đăng nhập bằng tài khoản BGH → tab *Danh sách CBVC* → nhập danh sách cán bộ (Excel) → chạy tiếp
   `npm run reset:passwords -- --missing-only` để cấp tài khoản cho người mới.
4. Yêu cầu mọi người **đổi mật khẩu ngay lần đầu** (menu tài khoản) hoặc dùng *Quên mật khẩu* trên trang đăng nhập.

## 3. Triển khai
```
firebase login
npm test               # kiểm tra kiểu + luật (nhanh)
npm run test:rules     # kiểm thử luật trên emulator (cần Java)
npm run deploy         # build + deploy hosting và firestore.rules
```
Tự động qua GitHub Actions: thêm các *repository secrets* `FIREBASE_SERVICE_ACCOUNT` (nội dung JSON khóa dịch vụ) và
`VITE_FIREBASE_PROJECT_ID, _APP_ID, _API_KEY, _AUTH_DOMAIN, _FIRESTORE_DATABASE_ID, _STORAGE_BUCKET, _MESSAGING_SENDER_ID`.

## 3b. Bảng xếp hạng công khai
Mọi tài khoản đã đăng nhập đều xem được xếp hạng toàn trường, nhưng chỉ thấy **kết quả đã được BGH duyệt hoặc khóa sổ**, gồm: họ tên, mã, tổ, chức vụ, điểm chốt, tổng điểm cộng và tổng điểm trừ.
Nội dung chi tiết từng mục cộng/trừ, ghi chú và ý kiến **không** được công bố (nằm ở bộ sưu tập `rankings`, tách khỏi `scores`).
- Bảng này được BGH tự cập nhật mỗi khi duyệt, duyệt tất cả, khóa sổ hoặc sửa điểm.
- **Sau lần triển khai đầu tiên**, BGH bấm nút *Đồng bộ* (chấm trạng thái ở góc trên) một lần để công bố các tháng đã duyệt từ trước.
- Nếu có thông báo "Không thể công bố bảng xếp hạng", bấm *Đồng bộ* để công bố lại.

## 4. Vận hành hằng ngày
| Việc | Lệnh |
|---|---|
| Đổi Tổ trưởng / đổi vai trò / đổi tổ của cán bộ | `npm run sync:claims` |
| Thêm cán bộ mới (đã có hồ sơ trong app) | `npm run reset:passwords -- --missing-only` |
| Cán bộ nghỉ/chuyển (đã xóa hồ sơ) | `npm run sync:claims -- --dry-run` rồi `npm run sync:claims -- --disable-orphans` |
| Quên mật khẩu | Người dùng bấm *Quên mật khẩu* trên trang đăng nhập |

`sync:claims` **không** đổi mật khẩu; người bị đổi quyền sẽ bị đăng xuất để quyền mới có hiệu lực ngay.
Đừng dùng `reset:passwords` không kèm `--missing-only` khi chỉ cần đổi quyền: lệnh đó đặt lại mật khẩu của **tất cả** mọi người.

## 5. Sao lưu thật
Mục "Sao lưu" trong ứng dụng chỉ lưu **trên trình duyệt đang dùng** (tối đa 5 bản), KHÔNG phải sao lưu đám mây.
Nên bật xuất Firestore định kỳ (cần gói Blaze):
`gcloud firestore export gs://<bucket>/backup-$(date +%F)` (đặt lịch bằng Cloud Scheduler), hoặc xuất Excel cuối mỗi tháng sau khi khóa sổ.

## 6. Kiểm thử trước khi mở cho toàn trường
Đăng nhập lần lượt 4 loại tài khoản (BGH, Tổ trưởng, giáo viên, BTĐ) và kiểm tra: dữ liệu hiển thị đúng phạm vi, Tổ trưởng nộp điểm được,
BGH duyệt/khóa được, giáo viên không sửa được điểm. Thử đăng nhập sai nhiều lần và thử *Quên mật khẩu*.

## 7. Bảo mật cần làm ngay
- Đặt kho mã GitHub ở chế độ **Private**. Lịch sử git cũ vẫn chứa danh sách nhân sự thật; nếu cần xóa hẳn, dùng `git filter-repo` rồi force-push.
- Thư viện `xlsx` bản trên npm (0.18.5) có lỗ hổng đã biết và không còn được vá trên npm. Nâng lên bản chính chủ:
  `npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (kiểm tra lại chức năng nhập/xuất Excel sau khi nâng).
- Dữ liệu mẫu/nhân sự dùng để gieo dữ liệu nằm ở `scripts/seed/` và không còn được đóng gói vào bản chạy công khai.
