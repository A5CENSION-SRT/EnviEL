/*
 * EnviEL — SentinelSound ML Sensor Node (FINAL)
 * Target: Arduino Uno (ATmega328P)
 * Mic: MAX4466 (3.3V, analog out)
 *
 * Changes from v1:
 *   - 10-bit ADC used for trigger detection (no resolution loss)
 *   - 8-bit stream to Python preserved (raw >> 2), so serial_bridge.py
 *     does not need to change
 *   - Fully non-blocking: no delay() anywhere in loop()
 *   - LED blink, gunshot alert, and serial wait are all state-machine driven
 * Hardware:
 *   - Sound sensor → analog out → A0
 *   - 16x2 I2C LCD → SDA=A4, SCL=A5 (PCF8574 backpack, addr 0x27 or 0x3F)
 *   - Green LED   → pin 7 (220Ω to GND)
 *   - 16x2 I2C LCD → SDA=A4, SCL=A5 (PCF8574 backpack, addr 0x27 or 0x3F)
 *
 * Library required: LiquidCrystal_I2C by Frank de Brabander
 * Baud rate: 115200 (must match serial_bridge.py)
 * Sample rate: ~4000 Hz (250 us/sample)
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ─── PINS ───────────────────────────────────────────────────────────────
#define MIC_PIN   A0
#define LED_PIN    7

// ─── NOISE GATE (10-bit scale, 0–1023) ─────────────────────────────────
// MAX4466 idle noise floor is usually 0–15 counts of jitter.
// Speech at ~60cm: ~40–150 pp.  Shout: ~150–300 pp.  Gunshot: 300+ pp.
// Tune experimentally with Serial.println(raw) if false triggers occur.
#define NOISE_GATE_THRESHOLD  300

// Set to 1 to print each window's peak-to-peak value over serial for gain
// tuning (e.g. "pp=342"). Set to 0 for normal operation — printing adds
// serial overhead you don't want once this is running against Python.
#define DEBUG_PP  1

// Pre-detection window — how long we accumulate min/max before checking
// against NOISE_GATE_THRESHOLD. Gunshot impulses are only a few ms wide,
// so shorter windows react faster but see less of the waveform per check.
// Tune this directly in ms; samples are derived automatically at 4kHz.
#define PRE_DETECT_WINDOW_MS   25
#define PRE_DETECT_SAMPLES     (PRE_DETECT_WINDOW_MS * 4)   // 4 samples/ms @ 4kHz

// Full inference window streamed to Python once triggered.
#define INFERENCE_SAMPLES   4000

// Max time to wait for Python's classification result before giving up.
#define ML_RESULT_TIMEOUT_MS 3000

// LED blink timing during a trigger pulse / gunshot alert
#define BLINK_INTERVAL_MS 80

// ─── LCD ─────────────────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);  // try 0x3F if blank

// ─── STATE MACHINE ────────────────────────────────────────────────────────
enum State {
  MONITORING,       // watching pre-detection window
  STREAMING,        // sending INFERENCE_SAMPLES bytes to Python
  WAITING_RESULT,   // waiting (non-blocking) for 'G'/'N' from Python
  ALERT_BLINK,      // gunshot alert — LED blinking, LCD showing alert
  TRIGGER_PULSE     // brief LED pulse marking a trigger, before streaming
};

State state = MONITORING;

unsigned int  gunshotCount   = 0;
unsigned long alertStartMs   = 0;
unsigned long resultWaitMs   = 0;
unsigned long lastBlinkMs    = 0;
bool          ledState       = true;
int           blinkCount     = 0;

// Pre-detection rolling min/max (10-bit)
int preMin = 1023, preMax = 0;
int preSampleCount = 0;

// Inference window counter
int inferSampleCount = 0;

// Sample timing
unsigned long lastSampleUs = 0;

// LCD change tracking (avoids lcd.clear() flicker)
char lcdLine1[17] = "";
char lcdLine2[17] = "";

// ─── SETUP ──────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // Speed up ADC: prescaler 16 → ~14us/read (default is 112us)
  ADCSRA = (ADCSRA & 0xF8) | 0x04;

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);

  lcd.init();
  lcd.backlight();

  lcdWrite("EnviEL v2.0", "Booting...");
  delay(1000);  // one-time boot delay only, not inside loop()

  showIdle();
  lastSampleUs = micros();
}

// ─── MAIN LOOP (fully non-blocking) ──────────────────────────────────────
void loop() {
  unsigned long nowMs = millis();

  // ── Auto-clear gunshot alert after 4s ──────────────────────────────────
  if (state == ALERT_BLINK) {
    if (nowMs - alertStartMs > 4000) {
      state = MONITORING;
      digitalWrite(LED_PIN, HIGH);
      showIdle();
    } else if (nowMs - lastBlinkMs >= BLINK_INTERVAL_MS) {
      lastBlinkMs = nowMs;
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
    }
  }

  // ── Non-blocking trigger pulse (brief LED flash before streaming) ─────
  if (state == TRIGGER_PULSE) {
    if (nowMs - lastBlinkMs >= 20) {
      digitalWrite(LED_PIN, HIGH);
      state = STREAMING;
      inferSampleCount = 0;
    }
  }

  // ── Non-blocking wait for Python's ML result ───────────────────────────
  if (state == WAITING_RESULT) {
    if (Serial.available()) {
      char r = Serial.read();
      if (r == 'G') {
        gunshotCount++;
        state = ALERT_BLINK;
        alertStartMs = nowMs;
        lastBlinkMs = nowMs;
        showGunshot();
      } else {
        state = MONITORING;
        showIdle();
      }
      preMin = 1023; preMax = 0; preSampleCount = 0;
    } else if (nowMs - resultWaitMs > ML_RESULT_TIMEOUT_MS) {
      // Python didn't respond in time — don't block, just resume monitoring
      state = MONITORING;
      preMin = 1023; preMax = 0; preSampleCount = 0;
    }
    return; // don't sample mic while waiting on serial
  }

  // ── Sample mic at 4kHz ───────────────────────────────────────────────
  unsigned long nowUs = micros();
  if (nowUs - lastSampleUs < 250) return;
  lastSampleUs += 250;
  // Resync if we've fallen badly behind (e.g. after a long serial write burst)
  if (nowUs - lastSampleUs > 2000) lastSampleUs = nowUs;

  int raw = analogRead(MIC_PIN);  // 10-bit, 0–1023

  if (state == MONITORING) {
    if (raw > preMax) preMax = raw;
    if (raw < preMin) preMin = raw;
    preSampleCount++;

    if (preSampleCount >= PRE_DETECT_SAMPLES) {
      int pp = preMax - preMin;

      if (pp >= NOISE_GATE_THRESHOLD) {
        state = TRIGGER_PULSE;
        digitalWrite(LED_PIN, LOW);
        lastBlinkMs = nowMs;
      } else {
#if DEBUG_PP
        Serial.print(F("pp="));
        Serial.println(pp);
#endif
        preMin = 1023; preMax = 0; preSampleCount = 0;
      }
    }

  } else if (state == STREAMING) {
    Serial.write((uint8_t)(raw >> 2));  // 10-bit → 8-bit for Python bridge
    inferSampleCount++;

    if (inferSampleCount >= INFERENCE_SAMPLES) {
      state = WAITING_RESULT;
      resultWaitMs = millis();
    }
  }
}

// ─── DISPLAY HELPERS (flicker-free: only redraw changed line) ──────────
void showGunshot() {
  char l2[17];
  snprintf(l2, sizeof(l2), "Shots:%-3u", gunshotCount);
  lcdWrite("! GUNSHOT !", l2);
}

void showIdle() {
  char l2[17];
  snprintf(l2, sizeof(l2), "Shots:%-3u", gunshotCount);
  lcdWrite("SentinelSound", l2);
}

void lcdWrite(const char* l1, const char* l2) {
  if (strcmp(l1, lcdLine1) != 0) {
    lcd.setCursor(0, 0);
    lcd.print("                "); // clear line 1 only
    lcd.setCursor(0, 0);
    lcd.print(l1);
    strncpy(lcdLine1, l1, 16);
    lcdLine1[16] = '\0';
  }
  if (strcmp(l2, lcdLine2) != 0) {
    lcd.setCursor(0, 1);
    lcd.print("                "); // clear line 2 only
    lcd.setCursor(0, 1);
    lcd.print(l2);
    strncpy(lcdLine2, l2, 16);
    lcdLine2[16] = '\0';
  }
}
