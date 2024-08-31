#include <DebugMacros.h>
#include <HTTPSRedirect.h>
#include <ESP8266WiFi.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// WiFi credentials
const char* ssid = "IITH-Guest-PWD-IITH@2023";
const char* password = "IITH@2023";

// Google Script ID and URL
const char* GScriptId = "AKfycbwyauDw2OuKZn8ee0Oko3VZq-kvVD0nd1sC0psQo5-oOWQH-zcitLWD6Vu6uL4mIUTa";
const char* host = "script.google.com";
const int httpsPort = 443;
String url = String("/macros/s/") + GScriptId + "/exec";

// NTP settings
const long utcOffsetInSeconds = 19800; // 5 hours 30 minutes = 5*3600 + 30*60 = 19800

// Global objects
HTTPSRedirect* client = nullptr;
PZEM004Tv30 pzem(13, 12); // RX, TX
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffsetInSeconds, 10000); // Update every 10 seconds

void connectWiFi();
void initializeHTTPS();
String getFormattedTime();
void collectAndSendData();
void waitForNextInterval();

void setup() {
  Serial.begin(9600);
  connectWiFi();
  initializeHTTPS();
  timeClient.begin();
  Serial.println("NTP client started");

  // Wait until time is updated
  while (!timeClient.update()) {
    delay(1000);
    Serial.println("Waiting for NTP time sync...");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  if (client != nullptr && !client->connected()) {
    client->connect(host, httpsPort);
  }

  waitForNextInterval();
  collectAndSendData();
}

void connectWiFi() {
  Serial.print("Connecting to ");
  Serial.print(ssid);
  Serial.println(" ...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.print("IP address:\t");
  Serial.println(WiFi.localIP());
}

void initializeHTTPS() {
  client = new HTTPSRedirect(httpsPort);
  client->setInsecure();
  client->setPrintResponseBody(true);
  client->setContentTypeHeader("application/json");
}

String getFormattedTime() {
  time_t rawTime = timeClient.getEpochTime();
  struct tm *timeInfo = localtime(&rawTime);

  char buffer[20];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          timeInfo->tm_year + 1900,
          timeInfo->tm_mon + 1,
          timeInfo->tm_mday,
          timeInfo->tm_hour,
          timeInfo->tm_min,
          timeInfo->tm_sec);

  return String(buffer);
}

void collectAndSendData() {
  // Collect sensor data and timestamp
  timeClient.update();
  String formattedTime = getFormattedTime();
  float voltage = pzem.voltage();
  float current = pzem.current();
  float power = pzem.power();
  float energy = pzem.energy();
  float frequency = pzem.frequency();
  float pf = pzem.pf();

  // Create variable for error code
  int errorCode = 0; // Default value for 'Error Code'

  // Format values as a comma-separated string
  String valuesStr = String(formattedTime) + ',' +
                      String(voltage) + ',' +
                      String(current) + ',' +
                      String(power) + ',' +
                      String(energy) + ',' +
                      String(frequency) + ',' +
                      String(pf) + ',' +
                      String(errorCode); // Convert int to String

  // Create JSON object string to send to Google Drive
  StaticJsonDocument<300> doc; // Increased size for additional fields
  doc["command"] = "insert_data";
  doc["module_name"] = "MODULE29"; // Update this value as needed
  doc["values"] = valuesStr;

  String payload;
  serializeJson(doc, payload);

  // Publish data to Google Drive
  Serial.println("Publishing data...");
  Serial.println(payload);
  if (client->POST(url, host, payload)) {
    Serial.println("Data published successfully");
  } else {
    Serial.println("Error while connecting");
  }
}

void waitForNextInterval() {
  while (true) {
    timeClient.update();
    int currentSecond = timeClient.getSeconds();
    if (currentSecond % 30 == 0) { // Changed to 30 seconds to match script expectations
      break;
    }
    delay(1000); // Wait for 1 second before checking again
  }
}