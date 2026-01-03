import mqtt from "mqtt";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";

const prisma = new PrismaClient();

let io;

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

const TOPIC_STATUS = "petfeeder/status";
const TOPIC_FOOD_LEVEL = "petfeeder/food_level";
const TOPIC_FEED_NOW = "petfeeder/feed_now";
const TOPIC_FEED_RESULT = "petfeeder/feed_result";

const client = mqtt.connect(MQTT_URL);

const cronJobs = {};

/* MQTT CONNECTION */

client.on("connect", () => {
    console.log("[MQTT] Connected:", MQTT_URL);

    client.subscribe([TOPIC_STATUS, TOPIC_FOOD_LEVEL, TOPIC_FEED_NOW, TOPIC_FEED_RESULT], (e) => {
        if (e) console.error("[MQTT] Subscribe error:", e);
        else console.log("[MQTT] Subscribed to topics");
    });

    loadSchedules(); // load cron job khi server start
});

/* MQTT MESSAGE LISTENER  */

client.on("message", async (topic, message) => {
    const msg = message.toString();
    console.log(`[MQTT] Received ${topic}: ${msg}`);

    try {
        if (topic === TOPIC_STATUS) {
            const payload = JSON.parse(msg);
            const device = await prisma.device.findUnique({
                where: { deviceId: payload.deviceId }
            });

            if (device && io) {
                io.emit("device_status", {
                    deviceId: payload.deviceId,
                    status: payload.status
                });
            }
        }

        if (topic === TOPIC_FOOD_LEVEL) {
            const payload = JSON.parse(msg);
            const device = await prisma.device.findUnique({
                where: { deviceId: payload.deviceId }
            });

            if (device) {
            await prisma.foodLevelLog.create({
                data: { 
                    deviceId: device.id, 
                    level: payload.level,
                    weight: payload.weight 
                }
            });

            if (io) {
                io.emit("food_level", {
                    deviceId: payload.deviceId,
                    level: payload.level,
                    weight: payload.weight 
                 });
                }
            }
        }

        if (topic === TOPIC_FEED_RESULT) {
        try {
            const payload = JSON.parse(msg);
            console.log(`[MQTT] Feed Result for ${payload.deviceId}: ${payload.status}`);

            // Gửi qua Socket cho Frontend
            if (io) {
                io.emit("feed_callback", {
                    deviceId: payload.deviceId,
                    status: payload.status, // "success" hoặc "error"
                    message: payload.message
                });
            }
        } catch (e) {
            console.error("Error parsing feed result:", e);
        }
    }


    } catch (e) {
        console.error("[MQTT] Error processing message:", e);
    }
});

/* MQTT COMMAND */

export const feedNow = (deviceId, amount = null) => {
    const payload = JSON.stringify({ deviceId, amount });

    client.publish(TOPIC_FEED_NOW, payload, (e) => {
        if (e) console.error("[MQTT] Send feed error:", e);
        else console.log(`[MQTT] Sent feed-now to device ${deviceId}`);
    });
};

export const setSocketIo = (instance) => {
    io = instance;
};


// Bắt đầu job
export const startCronJob = (schedule) => {
    try {
        const { id, deviceId, timeCron, amount } = schedule;

        if (!cron.validate(timeCron)) {
            console.error("[CRON] Invalid expression:", timeCron);
            return;
        }

        if (cronJobs[id]) {
            cronJobs[id].stop();
            delete cronJobs[id];
        }

        console.log(`[CRON] Starting job #${id} → ${timeCron}`);

        cronJobs[id] = cron.schedule(timeCron, async () => {
            console.log(`[CRON] Executing job #${id} for device ${deviceId}`);

            const device = await prisma.device.findUnique({ where: { id: deviceId } });
            if (!device) return console.error(`[CRON] Device ${deviceId} not found`);

            const payload = JSON.stringify({
                deviceId: device.deviceId,
                amount,
                command: "FEED"
            });

            client.publish(TOPIC_FEED_NOW, payload);

            await prisma.feedingLog.create({
                data: {
                    deviceId,
                    amount,
                    type: "scheduled"
                }
            });
        });

    } catch (e) {
        console.error("[CRON] Fatal error:", e);
    }
};

// Load tất cả lịch khi server khởi động
export const loadSchedules = async () => {
    const schedules = await prisma.feedingSchedule.findMany({
        where: { enabled: true }
    });

    console.log(`[CRON] Loading ${schedules.length} schedules`);

    schedules.forEach(startCronJob);
};

// Stop + xóa job
export const stopCronJob = async (scheduleId) => {
    if (cronJobs[scheduleId]) {
        cronJobs[scheduleId].stop();
        delete cronJobs[scheduleId];

        console.log(`[CRON] Stopped job #${scheduleId}`);
    }
};
