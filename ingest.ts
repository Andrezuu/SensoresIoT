import mqtt from "mqtt";
import axios from "axios";

// Diccionario de estados de dispositivos
const deviceStates: Record<string, number> = {};
const MQTT_BROKER = "mqtt://broker.hivemq.com:1883";
const STORAGE_ENDPOINT = "http://localhost:3000/store";

// Cliente MQTT
const mqttClient = mqtt.connect(MQTT_BROKER);

// Subscribe cuando se conecte
mqttClient.on("connect", () => {
  console.log("[MQTT] Conectado al broker");
  mqttClient.subscribe("iot/lab/+/data");
  mqttClient.subscribe("iot/lab/+/status");
});

// Cuando se recibe un mensaje
mqttClient.on("message", async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const [, , deviceId, type] = topic.split("/");

    console.log(`[MQTT] Mensaje recibido en ${topic} ->`, payload);

    if (type === "data") {
      deviceStates[deviceId] = Date.now();

      const postData = {
        device_id: parseInt(deviceId),
        temperature: payload.temperature,
        rssi: payload.rssi,
      };

      const response = await axios.post(STORAGE_ENDPOINT, postData);
      console.log(`[POST] Datos enviados para ${deviceId}`, response.data);
    }
  } catch (err) {
    console.error("[ERROR] Fallo al procesar mensaje:", err);
  }
});

// Verificación periódica de timeouts
setInterval(() => {
  const now = Date.now();
  for (const [deviceId, lastSeen] of Object.entries(deviceStates)) {
    if (now - lastSeen > 45_000) {
      console.warn(`[TIMEOUT] Device ${deviceId} está OFFLINE (timeout)`);
      delete deviceStates[deviceId];
    }
  }
}, 10_000);
