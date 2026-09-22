#include <WiFi.h>
#include <PubSubClient.h>

// Pins Definition
const int RELAY_PINS[4]  = {5, 6, 7, 8};
const int LED_PINS[4]    = {9, 10, 11, 12};
const int BUTTON_PINS[4] = {13, 14, 15, 16};

// State variables
bool relayStates[4] = {false, false, false, false};
bool lastButtonStates[4] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastDebounceTime[4] = {0, 0, 0, 0};
const unsigned long debounceDelay = 50; // 50ms for debounce
bool buttonHandled[4] = {false, false, false, false};

const char *MQTT_BROKER = "broker.hivemq.com";
const int MQTT_PORT = 1883;
const char *COMMAND_TOPIC = "dcswitch/475688253278273537/cmd";
const char *STATE_TOPIC = "dcswitch/475688253278273537/state";
const char *STATUS_TOPIC = "dcswitch/475688253278273537/status"; // "online" / "offline" (LWT)

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

void publishStates() {
  String payload = "{\"states\":[";

  for (int i = 0; i < 4; i++) {
    if (i > 0) {
      payload += ",";
    }

    payload += relayStates[i] ? "true" : "false";
  }

  payload += "]}";

  mqtt.publish(STATE_TOPIC, payload.c_str(), true);
}

void setRelay(int channel, bool state) {
  if (channel < 0 || channel >= 4) {
    return;
  }

  relayStates[channel] = state;
  digitalWrite(RELAY_PINS[channel], state ? HIGH : LOW);
  digitalWrite(LED_PINS[channel], state ? HIGH : LOW);
}

void toggleRelay(int channel) {
  if (channel < 0 || channel >= 4) {
    return;
  }

  setRelay(channel, !relayStates[channel]);

  Serial.print("Canal ");
  Serial.print(channel + 1);
  Serial.println(relayStates[channel] ? " -> LIGADO" : " -> DESLIGADO");

  publishStates();
}

int readChannelFromMessage(String message) {
  int channelKey = message.indexOf("\"channel\"");
  if (channelKey < 0) {
    return -1;
  }

  int colon = message.indexOf(":", channelKey);
  if (colon < 0) {
    return -1;
  }

  for (int i = colon + 1; i < message.length(); i++) {
    if (isDigit(message[i])) {
      return message.substring(i, i + 1).toInt();
    }
  }

  return -1;
}

void handleMqttMessage(char *topic, byte *payload, unsigned int length) {
  if (String(topic) != COMMAND_TOPIC) {
    return;
  }

  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  if (message.indexOf("\"toggle\"") >= 0) {
    toggleRelay(readChannelFromMessage(message));
  }
}

void connectMqtt() {
  while (!mqtt.connected()) {
    String clientId = "dcswitch-sim-" + String((uint32_t)ESP.getEfuseMac(), HEX);

    Serial.print("Conectando ao MQTT...");
    // Last Will: se o ESP32 desligar, o broker publica "offline" no tópico de presença
    if (mqtt.connect(clientId.c_str(), NULL, NULL, STATUS_TOPIC, 0, true, "offline")) {
      Serial.println(" conectado.");
      mqtt.subscribe(COMMAND_TOPIC);
      mqtt.publish(STATUS_TOPIC, "online", true);
      publishStates();
    } else {
      Serial.print(" falhou, rc=");
      Serial.print(mqtt.state());
      Serial.println(". Nova tentativa em 2s.");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    // Configura saídas
    pinMode(RELAY_PINS[i], OUTPUT);
    pinMode(LED_PINS[i], OUTPUT);

    // Estado inicial desligado
    setRelay(i, false);

    // Configura botões com PULL-UP interno
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
  }

  Serial.print("Conectando ao WiFi do Wokwi");
  WiFi.begin("Wokwi-GUEST", "", 6);
  while (WiFi.status() != WL_CONNECTED) {
    delay(100);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi conectado. IP do ESP32 simulado: ");
  Serial.println(WiFi.localIP());

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(handleMqttMessage);
  connectMqtt();

  Serial.println("MQTT pronto.");
  Serial.print("Topico de comandos: ");
  Serial.println(COMMAND_TOPIC);
  Serial.print("Topico de estado: ");
  Serial.println(STATE_TOPIC);
}

void loop() {
  if (!mqtt.connected()) {
    connectMqtt();
  }

  mqtt.loop();

  for (int i = 0; i < 4; i++) {
    int reading = digitalRead(BUTTON_PINS[i]);

    // Verifica alteração por ruído/bounce
    if (reading != lastButtonStates[i]) {
      lastDebounceTime[i] = millis();
    }

    if ((millis() - lastDebounceTime[i]) > debounceDelay) {
      // Se o estado do botão estabilizou em LOW (pressionado)
      if (reading == LOW && !buttonHandled[i]) {
        toggleRelay(i);
        buttonHandled[i] = true;
      } else if (reading == HIGH) {
        buttonHandled[i] = false;
      }
    }

    lastButtonStates[i] = reading;
  }
}
