/*
 * EnviEL — SentinelSound Anti-Poaching Acoustic Sensor Node
 *
 * Hardware:
 *   - ESP32 development board
 *   - 16x2 I2C LCD (PCF8574 backpack, address 0x27 or 0x3F)
 *   - Analog microphone/sound sensor (MAX9814 / KY-038 style) on GPIO34
 *   - Green status LED on GPIO2
 *
 * Libraries required (install via Arduino Library Manager):
 *   - LiquidCrystal_I2C  by Frank de Brabander
 *   - ArduinoJson         by Benoit Blanchon
 *   - WiFi                (built-in ESP32)
 *   - HTTPClient          (built-in ESP32)
 *   - NTPClient           by Fabrice Weinberg
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <NTPClient.h>
#include <WiFiUDP.h>

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Copy these from your Supabase project settings → API
const char* SUPABASE_URL      = "https://xxxxxxxxxxxx.supabase.co";
const char* SUPABASE_ANON_KEY = "your-anon-key-here";

// Unique identity for this physical node — change per device
const char* NODE_ID = "NODE-001";
const char* ZONE    = "Bandipur-Zone-A";

// GPS coordinates for this node's fixed position (update to actual location)
const float GPS_LAT = 11.6854;
const float GPS_LON = 76.6347;

// ─── PIN DEFINITIONS ──────────────────────────────────────────────────────────

#define MIC_PIN    34   // Analog input (use ADC1 pins on ESP32: 32-39)
#define LED_PIN     2   // Built-in or external green LED
#define SDA_PIN    21   // I2C data
#define SCL_PIN    22   // I2C clock

// ─── AUDIO DETECTION THRESHOLDS ───────────────────────────────────────────────
// ESP32 ADC is 12-bit (0–4095). Tune these using Serial Monitor + Serial Plotter.
// Peak-to-peak amplitude values after 50 ms sample window:
#define THRESHOLD_GUNSHOT  2800   // Very loud, sharp impulse
#define THRESHOLD_CHAINSAW 1800   // Sustained loud noise
#define THRESHOLD_VEHICLE  1000   // Lower rumble
// Below THRESHOLD_VEHICLE = ambient / ignored

#define SAMPLE_WINDOW_MS   50     // Audio sampling window
#define EVENT_COOLDOWN_MS  8000   // Min ms between reported events
#define HEARTBEAT_INTERVAL 30000  // Node ping every 30 seconds

// ─── OBJECTS ──────────────────────────────────────────────────────────────────

LiquidCrystal_I2C lcd(0x27, 16, 2);  // Try 0x3F if screen stays blank

WiFiUDP   ntpUDP;
NTPClient ntp(ntpUDP, "pool.ntp.org", 19800, 60000); // IST = UTC+5:30

// ─── STATE ────────────────────────────────────────────────────────────────────

enum EventType { NONE, GUNSHOT, CHAINSAW, VEHICLE };

bool          wifiConnected  = false;
unsigned long lastHeartbeat  = 0;
unsigned long lastEventMs    = 0;
int           eventsThisHour = 0;

// ─── SETUP ────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcdPrint("EnviEL v1.0", "Booting...");

  delay(1500);
  connectWiFi();

  if (wifiConnected) {
    ntp.begin();
    ntp.update();
    registerNode();
  }

  lcdPrint("SentinelSound", "Listening...");
  digitalWrite(LED_PIN, HIGH);
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────

void loop() {
  int amplitude = sampleAmplitude();

  EventType event = classify(amplitude);

  if (event != NONE && millis() - lastEventMs > EVENT_COOLDOWN_MS) {
    lastEventMs = millis();
    handleDetection(event, amplitude);
  }

  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    lastHeartbeat = millis();
    heartbeat();
  }

  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectWiFi();
  }
}

// ─── AUDIO SAMPLING ───────────────────────────────────────────────────────────

int sampleAmplitude() {
  unsigned long t   = millis();
  int           hi  = 0;
  int           lo  = 4095;

  while (millis() - t < SAMPLE_WINDOW_MS) {
    int v = analogRead(MIC_PIN);
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  }

  return hi - lo; // peak-to-peak
}

// ─── EVENT CLASSIFICATION ─────────────────────────────────────────────────────

EventType classify(int amp) {
  if (amp >= THRESHOLD_GUNSHOT)  return GUNSHOT;
  if (amp >= THRESHOLD_CHAINSAW) return CHAINSAW;
  if (amp >= THRESHOLD_VEHICLE)  return VEHICLE;
  return NONE;
}

struct EventMeta {
  String type;
  String severity;
  float  confidence;
};

EventMeta buildMeta(EventType event, int amp) {
  EventMeta m;
  switch (event) {
    case GUNSHOT:
      m.type     = "gunshot";
      m.severity = "critical";
      m.confidence = mapConfidence(amp, THRESHOLD_GUNSHOT, 4095, 0.82f, 0.97f);
      break;
    case CHAINSAW:
      m.type     = "chainsaw";
      m.severity = "high";
      m.confidence = mapConfidence(amp, THRESHOLD_CHAINSAW, THRESHOLD_GUNSHOT, 0.68f, 0.88f);
      break;
    case VEHICLE:
      m.type     = "vehicle";
      m.severity = "medium";
      m.confidence = mapConfidence(amp, THRESHOLD_VEHICLE, THRESHOLD_CHAINSAW, 0.55f, 0.78f);
      break;
    default:
      m.type = "unknown"; m.severity = "low"; m.confidence = 0.0f;
  }
  return m;
}

float mapConfidence(int amp, int lo, int hi, float outLo, float outHi) {
  float ratio = (float)(amp - lo) / (float)(hi - lo);
  if (ratio < 0.0f) ratio = 0.0f;
  if (ratio > 1.0f) ratio = 1.0f;
  return outLo + ratio * (outHi - outLo);
}

// ─── EVENT HANDLING ───────────────────────────────────────────────────────────

void handleDetection(EventType event, int amp) {
  EventMeta m = buildMeta(event, amp);
  eventsThisHour++;

  Serial.printf("[EVENT] %s | amp=%d | conf=%.2f | sev=%s\n",
                m.type.c_str(), amp, m.confidence, m.severity.c_str());

  // LCD: show alert for 4 seconds
  String line1 = "! " + m.type;
  line1.toUpperCase();
  String line2 = "Conf:" + String(int(m.confidence * 100)) + "% " + m.severity.substring(0, 4);
  lcdPrint(line1, line2);

  // Flash LED rapidly to indicate alert
  for (int i = 0; i < 6; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(120);
    digitalWrite(LED_PIN, HIGH);
    delay(120);
  }

  reportEvent(m, amp);

  delay(4000);
  lcdPrint("SentinelSound", "Listening...");
}

// ─── SUPABASE REPORTING ───────────────────────────────────────────────────────

void reportEvent(EventMeta& m, int rawAmp) {
  if (!wifiConnected) {
    Serial.println("[OFFLINE] Event buffered (not yet implemented)");
    return;
  }

  ntp.update();
  String ts = ntp.getFormattedTime(); // HH:MM:SS — Supabase accepts ISO8601
  // Build a full ISO timestamp (date comes from NTP epoch)
  String isoTs = epochToISO(ntp.getEpochTime());

  StaticJsonDocument<256> doc;
  doc["node_id"]             = NODE_ID;
  doc["event_type"]          = m.type;
  doc["severity"]            = m.severity;
  doc["confidence"]          = serialized(String(m.confidence, 3));
  doc["verification_status"] = "pending";
  doc["timestamp"]           = isoTs;

  String body;
  serializeJson(doc, body);

  int code = supabasePost("/rest/v1/poaching_events", body);
  Serial.printf("[HTTP] POST /poaching_events -> %d\n", code);

  if (code >= 200 && code < 300) {
    // Quick blink to confirm upload
    digitalWrite(LED_PIN, LOW); delay(80);
    digitalWrite(LED_PIN, HIGH);
  }
}

void registerNode() {
  ntp.update();

  StaticJsonDocument<256> doc;
  doc["id"]            = NODE_ID;
  doc["name"]          = String("Node ") + NODE_ID;
  doc["zone"]          = ZONE;
  doc["gps_lat"]       = GPS_LAT;
  doc["gps_lon"]       = GPS_LON;
  doc["status"]        = "online";
  doc["battery_level"] = readBattery();
  doc["last_seen"]     = epochToISO(ntp.getEpochTime());

  String body;
  serializeJson(doc, body);

  // Use upsert to handle re-registration after reboot
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/sensor_nodes";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "resolution=merge-duplicates,return=minimal");

  int code = http.POST(body);
  Serial.printf("[HTTP] Upsert sensor_nodes -> %d\n", code);
  http.end();
}

void heartbeat() {
  if (!wifiConnected) return;

  ntp.update();

  StaticJsonDocument<128> doc;
  doc["status"]        = "online";
  doc["battery_level"] = readBattery();
  doc["last_seen"]     = epochToISO(ntp.getEpochTime());

  String body;
  serializeJson(doc, body);

  String endpoint = String("/rest/v1/sensor_nodes?id=eq.") + NODE_ID;
  int code = supabasePatch(endpoint, body);
  Serial.printf("[HTTP] PATCH sensor_nodes -> %d | battery=%d%%\n", code, readBattery());

  // Update LCD briefly
  lcdPrint("Heartbeat sent", "Events: " + String(eventsThisHour));
  delay(2000);
  lcdPrint("SentinelSound", "Listening...");
}

// ─── HTTP HELPERS ─────────────────────────────────────────────────────────────

int supabasePost(String endpoint, String body) {
  HTTPClient http;
  http.begin(String(SUPABASE_URL) + endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");
  int code = http.POST(body);
  http.end();
  return code;
}

int supabasePatch(String endpoint, String body) {
  HTTPClient http;
  http.begin(String(SUPABASE_URL) + endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer", "return=minimal");
  int code = http.PATCH(body);
  http.end();
  return code;
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

void connectWiFi() {
  lcdPrint("Connecting WiFi", WIFI_SSID);
  Serial.print("[WiFi] Connecting");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 24) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("\n[WiFi] Connected: " + WiFi.localIP().toString());
    lcdPrint("WiFi OK", WiFi.localIP().toString());
  } else {
    wifiConnected = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("\n[WiFi] Failed — offline mode");
    lcdPrint("WiFi Failed", "Offline Mode");
  }
  delay(2000);
}

// Writes two lines to LCD, truncating at 16 chars each
void lcdPrint(String line1, String line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(line2.substring(0, 16));
}

// Converts Unix epoch to ISO 8601 string (UTC)
String epochToISO(unsigned long epoch) {
  time_t t = (time_t)epoch;
  struct tm* tm_info = gmtime(&t);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", tm_info);
  return String(buf);
}

// Read battery percentage via voltage divider on GPIO35
// Wire: VBAT → 100kΩ → GPIO35 → 100kΩ → GND  (for 3.7V LiPo)
int readBattery() {
  int raw = analogRead(35);
  // Map 3.0V–4.2V (raw ~1490–2090 with 1:2 divider on 3.3V ref) to 0–100%
  float voltage = (raw / 4095.0f) * 3.3f * 2.0f;
  int pct = (int)((voltage - 3.0f) / (4.2f - 3.0f) * 100.0f);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}
