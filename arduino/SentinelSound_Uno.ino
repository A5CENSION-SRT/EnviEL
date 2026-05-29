/*
 * EnviEL — SentinelSound ML Sensor Node
 * Target: Arduino Uno (ATmega328P)
 *
 * Noise-gated audio streaming:
 *   1. Continuously monitors mic amplitude in a short pre-detection window.
 *   2. Only when the peak-to-peak exceeds NOISE_GATE_THRESHOLD does it
 *      stream a full 1-second window (4000 bytes) to the Python ML bridge.
 *   3. Speech, footsteps, and ambient noise stay below the threshold and
 *      are never sent. Only sharp loud impulses (gunshots) trigger streaming.
 *
 * Hardware:
 *   - Sound sensor  → analog out → A0
 *   - Green LED     → pin 7 (220Ω resistor to GND)
 *   - 16x2 I2C LCD → SDA=A4, SCL=A5 (PCF8574 backpack, addr 0x27 or 0x3F)
 *
 * Library required (Sketch → Include Library → Manage Libraries):
 *   - LiquidCrystal_I2C  by Frank de Brabander
 *
 * Baud rate: 115200  (must match serial_bridge.py)
 * Sample rate: ~4000 Hz (250 µs per sample)
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ─── PINS ─────────────────────────────────────────────────────────────────────

#define MIC_PIN   A0
#define LED_PIN    7

// ─── NOISE GATE ───────────────────────────────────────────────────────────────
// Peak-to-peak amplitude (0–255) required in the pre-detection window before
// a full 1-second frame is streamed to the Python ML bridge.
// Speech at ~60 cm: ~20–60.  Shout: ~80–120.  Gunshot: 140+
// Raise if ambient noise triggers false positives.
// Lower if real gunshots are being missed.
#define NOISE_GATE_THRESHOLD  120

// Pre-detection window: monitor this many samples before deciding to trigger.
// 1000 samples @ 4 kHz = 250 ms  — short enough to catch a gunshot impulse.
#define PRE_DETECT_SAMPLES  1000

// Full inference window sent to Python once triggered.
#define INFERENCE_SAMPLES   4000

// ─── LCD ──────────────────────────────────────────────────────────────────────

LiquidCrystal_I2C lcd(0x27, 16, 2);  // Try 0x3F if screen stays blank

// ─── STATE ────────────────────────────────────────────────────────────────────

unsigned int  gunshotCount  = 0;
bool          alertActive   = false;
unsigned long alertStartMs  = 0;

// Pre-detection rolling min/max (no buffer needed — just two bytes)
uint8_t  preMin = 255, preMax = 0;
int      preSampleCount = 0;
bool     triggered = false;

// Inference window counter
int      inferSampleCount = 0;

// Sample timing
unsigned long lastSampleUs = 0;

// ─── SETUP ────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);

  // Speed up ADC: prescaler 16 → ~14 µs per analogRead (vs 112 µs default)
  // Enables reliable 4 kHz sampling while leaving headroom for other work.
  ADCSRA = (ADCSRA & 0xF8) | 0x04;

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  lcd.init();
  lcd.backlight();

  lcdPrint(F("EnviEL v1.0"), F("Booting..."));
  delay(1500);

  showIdle();
  digitalWrite(LED_PIN, HIGH);

  lastSampleUs = micros();
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────

void loop() {
  // ── Auto-clear gunshot alert after 4 seconds ──────────────────────────────
  if (alertActive && millis() - alertStartMs > 4000) {
    alertActive = false;
    showIdle();
  }

  // ── Check for ML result from Python (non-blocking) ────────────────────────
  if (Serial.available()) {
    char r = Serial.read();
    if (r == 'G') {
      gunshotCount++;
      alertActive  = true;
      alertStartMs = millis();
      showGunshot();
    }
    // 'N' = not a gunshot — do nothing (LCD already shows idle or previous alert)
  }

  // ── Sample mic at 4 kHz ───────────────────────────────────────────────────
  unsigned long nowUs = micros();
  if (nowUs - lastSampleUs < 250) return;
  lastSampleUs += 250;

  int raw     = analogRead(MIC_PIN);
  uint8_t s   = (uint8_t)(raw >> 2);   // 10-bit → 8-bit

  if (!triggered) {
    // ── Pre-detection phase: track amplitude, decide whether to trigger ──────
    if (s > preMax) preMax = s;
    if (s < preMin) preMin = s;
    preSampleCount++;

    if (preSampleCount >= PRE_DETECT_SAMPLES) {
      uint8_t pp = preMax - preMin;

      if (pp >= NOISE_GATE_THRESHOLD) {
        // Sound is loud enough — arm the inference window
        triggered       = true;
        inferSampleCount = 0;

        // Brief LED pulse to show trigger
        digitalWrite(LED_PIN, LOW);
        delay(20);
        digitalWrite(LED_PIN, HIGH);
      }

      // Reset pre-detection window regardless
      preMin = 255; preMax = 0; preSampleCount = 0;
    }

  } else {
    // ── Inference phase: stream exactly INFERENCE_SAMPLES bytes to Python ────
    Serial.write(s);
    inferSampleCount++;

    if (inferSampleCount >= INFERENCE_SAMPLES) {
      // Frame sent — wait for Python's result (blocking, max 3 s)
      unsigned long waitStart = millis();
      while (!Serial.available() && millis() - waitStart < 3000) {
        // yield
      }

      if (Serial.available()) {
        char r = Serial.read();
        if (r == 'G') {
          gunshotCount++;
          alertActive  = true;
          alertStartMs = millis();
          showGunshot();
        }
      }

      // Back to monitoring
      triggered        = false;
      inferSampleCount = 0;
      preMin = 255; preMax = 0; preSampleCount = 0;
    }
  }
}

// ─── DISPLAY HELPERS ──────────────────────────────────────────────────────────

void showGunshot() {
  char line2[17];
  snprintf(line2, sizeof(line2), "Shots:%-3u", gunshotCount);
  lcdPrintRaw("! GUNSHOT", line2);

  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, LOW);  delay(80);
    digitalWrite(LED_PIN, HIGH); delay(80);
  }
}

void showIdle() {
  char line2[17];
  snprintf(line2, sizeof(line2), "Shots:%-3u", gunshotCount);
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(F("SentinelSound"));
  lcd.setCursor(0, 1); lcd.print(line2);
}

void lcdPrint(const __FlashStringHelper* l1, const __FlashStringHelper* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
}

void lcdPrintRaw(const char* l1, const char* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
}
