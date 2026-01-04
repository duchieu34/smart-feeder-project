#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Servo.h>
#include <ArduinoJson.h>Ư
#include "HX711.h"

#include <WiFiManager.h> 
#include <DNSServer.h>
#include <ESP8266WebServer.h>


const char* mqtt_server = "xxxx.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user     = "";
const char* mqtt_password = "";
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" \
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n" \
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n" \
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n" \
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJIsG65VKRBYjSToH\n" \
"..."
"-----END CERTIFICATE-----";

// ================== CẤU HÌNH TOPIC ==================
const char* TOPIC_FEED_NOW   = "petfeeder/feed_now";
const char* TOPIC_FOOD_LEVEL = "petfeeder/food_level";
const char* DEVICE_ID        = "ESP8266-001";
const char* TOPIC_FEED_RESULT = "petfeeder/feed_result";

// ================== CẤU HÌNH CHÂN (PIN) ==================
const int PIN_SERVO  = D5;
const int PIN_BUTTON = D1;
const int PIN_LED    = LED_BUILTIN; // NodeMCU: LOW là sáng, HIGH là tắt
const int PIN_DT     = D2;
const int PIN_SCK    = D6;

// ================== CẤU HÌNH LOGIC ==================
const int MAX_BOWL_CAPACITY = 300;  // Giới hạn an toàn của bát (g)
const int DEFAULT_TARGET    = 50;   // Mức mặc định nếu không nhập số (g)
float calibration_factor    = 384.0; 

// ================== BIẾN TOÀN CỤC ==================
float lastSentWeight = -999.0;
unsigned long lastMsgTime = 0;
unsigned long lastReconnectAttempt = 0;

// Trạng thái hệ thống
bool webFeeding    = false;
bool buttonFeeding = false;

// Button Debounce
int lastButtonReading = HIGH;
int buttonState       = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

// Khởi tạo đối tượng
Servo        myServo;
WiFiClientSecure espClient; 
PubSubClient client(espClient);
HX711        scale;

// Khai báo hàm (Prototype)
void setup_wifi();
void callback(char* topic, byte* payload, unsigned int length);
void handleButton();
void attemptReconnect();
void handleScale();

// =========================================================
void setup() {
  Serial.begin(115200);

  // 1. Cấu hình GPIO
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH); // Tắt LED

  // 2. Cấu hình Servo
  myServo.attach(PIN_SERVO);
  myServo.write(0); // Đóng cửa

  // 3. Cấu hình Loadcell
  Serial.println("\nKhoi tao Loadcell...");
  scale.begin(PIN_DT, PIN_SCK);
  scale.set_scale(calibration_factor);
  scale.tare(); // Đảm bảo bát rỗng khi khởi động

  // 4. Kết nối mạng (WiFiManager)
  // PHẢI KẾT NỐI WIFI TRƯỚC KHI LẤY GIỜ
  setup_wifi(); 

  // 5. Cấu hình thời gian (NTP) SAU KHI CÓ WIFI
  Serial.print("Dang cap nhat thoi gian tu Internet");
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  // --- QUAN TRỌNG: Vòng lặp chờ thời gian cập nhật ---
  time_t now = time(nullptr);
  while (now < 100000) { // Nếu thời gian < năm 1970 + 100000s -> chưa update xong
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nDa dong bo thoi gian: " + String(ctime(&now)));
  // ----------------------------------------------------

  // 6. Cấu hình SSL/TLS
  // Tăng bộ nhớ đệm cho SSL (HiveMQ đôi khi gửi packet lớn)
  espClient.setBufferSizes(1024, 1024); 
  
  // Gán chứng chỉ
  //espClient.setTrustAnchors(new BearSSL::X509List(root_ca));
  
  // Nếu vẫn lỗi, bỏ comment dòng dưới để chạy chế độ không an toàn (để test)
  espClient.setInsecure(); 

  // 7. Cấu hình MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  Serial.println("\n=== SMART FEEDER READY ===");
}

// =========================================================
void loop() {
  handleButton(); // Luôn check nút bấm

  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      unsigned long now = millis();
      if (now - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = now;
        attemptReconnect();
      }
    } else {
      client.loop();
      // Chỉ đọc cân khi không bận xả
      if (!webFeeding && !buttonFeeding) {
        handleScale();
      }
    }
  }
}

// =========================================================
// HÀM XỬ LÝ LỆNH TỪ WEB (Smart Refill)
// =========================================================
void callback(char* topic, byte* payload, unsigned int length) {
  if (String(topic) == TOPIC_FEED_NOW) {
    
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    
    if (!error) {
       const char* id = doc["deviceId"];
       if (id && strcmp(id, DEVICE_ID) != 0) return;
    }

    if (buttonFeeding) return;

    // --- LẤY MỤC TIÊU ---
    int amount = doc["amount"];
    int targetWeight = (amount > 0) ? amount : DEFAULT_TARGET;
    if (targetWeight > MAX_BOWL_CAPACITY) targetWeight = MAX_BOWL_CAPACITY;

    Serial.print("\n>> LENH WEB: MUC TIEU "); 
    Serial.print(targetWeight); Serial.println("g (KHONG TRU HAO)");

    webFeeding = true;
    digitalWrite(PIN_LED, LOW);
    unsigned long startTime = millis();

    String status = "success";
    String message = "Đã cho ăn xong!";
    // VÒNG LẶP XẢ THÔNG MINH
    while (true) {
      // Đọc 1 mẫu để phản ứng nhanh nhất có thể
      float currentWeight = scale.get_units(1); 
      if (currentWeight < 0) currentWeight = 0;

      Serial.print("Hien tai: "); Serial.print(currentWeight);
      Serial.print("g / Dich: "); Serial.println(targetWeight);

      // --- ĐIỀU KIỆN DỪNG ---
      // Dừng ngay khi cân >= mục tiêu (Không trừ hao gì cả)
      if (currentWeight >= targetWeight) {
        status = "success";
        message = "Đã hoàn thành! Bát đã đủ " + String((int)currentWeight) + "g.";
        break;
      }

      // --- BẢO VỆ ---
      if (currentWeight > 500 || (millis() - startTime > 15000)) { // Tăng timeout lên 10s vì rót chậm sẽ lâu hơn
        Serial.println("-> STOP: Timeout hoac Qua tai");
        status = "error";
        message = "Lỗi: Hết thức ăn hoặc kẹt máy (Timeout)!";
        break;
      }

      // --- THUẬT TOÁN ĐIỀU KHIỂN ---
      float remaining = targetWeight - currentWeight;

      if (remaining > 25) {
        // GIAI ĐOẠN 1: Còn thiếu nhiều (>25g) -> Xả mạnh
        // Logic: Mở lớn, đóng nhanh để đẩy thức ăn ra
        myServo.write(120); 
        delay(300);         
        myServo.write(0);   
        delay(200);         
      } else {
        // GIAI ĐOẠN 2: Sắp đủ (<= 25g) -> Rót tinh (Nhấp nhả)
        // Logic: Mở rất nhỏ + thời gian cực ngắn + nghỉ lâu để cân ổn định
        Serial.println(">> Che do ROT TINH...");
        
        myServo.write(100);  // Góc mở nhỏ hơn (chỉ hé cửa)
        delay(80);          // Mở cực nhanh (80ms) rồi đóng ngay
        myServo.write(0);   // Đóng cửa
        
        // Quan trọng: Nghỉ lâu (1s) để đĩa hết rung, cân đo chính xác rồi mới quyết định rót tiếp hay không
        delay(1000);         
      }
    }

    digitalWrite(PIN_LED, HIGH);
    webFeeding = false;
    
    String resPayload = "{\"deviceId\":\"" + String(DEVICE_ID) + "\", \"status\":\"" + status + "\", \"message\":\"" + message + "\"}";
    client.publish(TOPIC_FEED_RESULT, resPayload.c_str());
    // Cập nhật lại UI lần cuối
    delay(500); 
    handleScale(); 
  }
}
// =========================================================
// HÀM ĐỌC CÂN (Đã tối ưu để nút bấm nhạy hơn)
// =========================================================
void handleScale() {
  unsigned long now = millis();

  // QUAN TRỌNG: Chỉ đọc mỗi 2 giây, thời gian còn lại để check nút bấm
  if (now - lastMsgTime < 2000) return; 

  float weight = scale.get_units(1); // Đọc 1 lần cho nhanh
  if (weight < 5.0) weight = 0;

  lastMsgTime     = now;
  lastSentWeight  = weight;

  int percentage = (int)((weight / (float)MAX_BOWL_CAPACITY) * 100);
  if (percentage > 100) percentage = 100;

  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["level"]    = percentage;
  doc["weight"]   = weight;

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(TOPIC_FOOD_LEVEL, buffer);
  Serial.print("Update: ");
  Serial.println(buffer);
}

// =========================================================
void setup_wifi() {
  WiFi.mode(WIFI_STA); // Đặt chế độ Station (kết nối wifi)

  // Khởi tạo WiFiManager
  WiFiManager wm;

  // Tùy chọn: Xóa cấu hình cũ để test (bỏ comment dòng dưới nếu muốn reset)
  // wm.resetSettings();

  // Tùy chọn: Đặt thời gian timeout (ví dụ 180s). 
  // Nếu không ai kết nối cấu hình sau 3 phút, chip sẽ reset thử lại.
  wm.setConfigPortalTimeout(180);

  Serial.println("Dang ket noi WiFi hoac tao Hotspot...");

  // Tự động kết nối:
  // 1. Thử kết nối WiFi cũ đã lưu.
  // 2. Nếu thất bại, tự phát WiFi tên "PetFeeder_Setup" (không mật khẩu hoặc set password tham số thứ 2).
  // 3. Chờ người dùng vào cấu hình.
  bool res = wm.autoConnect("PetFeeder_Setup", "12345678"); // Tên WiFi và Mật khẩu cấu hình

  if(!res) {
    Serial.println("Ket noi that bai (Timeout) -> Reset thiet bi");
    ESP.restart(); // Reset để thử lại
  } 
  else {
    Serial.println("\nWiFi da ket noi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  }
}

// =========================================================
void attemptReconnect() {
  String clientId = "ESP8266-Client-" + String(random(0xffff), HEX);
  
  // Thêm User và Password vào hàm connect
  if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
    Serial.println("MQTTS Connected");
    client.subscribe(TOPIC_FEED_NOW);
  } else {
    Serial.print("Failed, rc=");
    Serial.print(client.state());
    Serial.println(" try again in 5 seconds");
  }
}

// =========================================================
void handleButton() {
  int reading = digitalRead(PIN_BUTTON);

  if (reading != lastButtonReading) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (reading != buttonState) {
      buttonState = reading;

      if (buttonState == LOW && !webFeeding) {
        buttonFeeding = true;
        digitalWrite(PIN_LED, LOW);
        myServo.write(120); 
      }

      if (buttonState == HIGH && buttonFeeding) {
        myServo.write(0);   
        digitalWrite(PIN_LED, HIGH);
        buttonFeeding = false;
        lastMsgTime = 0; 
      }
    }
  }
  lastButtonReading = reading;
}