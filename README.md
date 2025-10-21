# MQTT Smart Pet Feeder 🐾

## Giới thiệu

Máy cho thú cưng ăn tự động, điều khiển từ xa qua mạng Internet bằng giao thức MQTT. Dự án cho phép người dùng cho ăn thủ công, đặt lịch hẹn giờ và theo dõi lịch sử cho ăn thông qua giao diện Web/Mobile App.

## Tính năng chính

* Điều khiển cho ăn từ xa.
* Hẹn giờ cho ăn linh hoạt.
* Thống kê lịch sử cho ăn.
* Hiển thị trạng thái hoạt động.

## Kiến trúc Hệ thống

Hệ thống bao gồm 3 thành phần chính:
1.  **Thiết bị Pet Feeder (ESP8266/ESP32):** Kết nối WiFi, điều khiển phần cứng, giao tiếp với MQTT Broker.
2.  **MQTT Broker:** Trung tâm nhận và chuyển tiếp tin nhắn (ví dụ: HiveMQ Cloud).
3.  **Giao diện Điều khiển (Web/Mobile App):** Gửi lệnh và hiển thị thông tin qua MQTT Broker (có thể thông qua Backend).

## Phần Cứng

* ESP8266 (NodeMCU) / ESP32
* Động cơ Servo / Động cơ Bước + Driver
* (Tùy chọn) Load Cell + HX711, LCD I2C
* Nguồn 5V
* Vỏ máy & Dây nối

