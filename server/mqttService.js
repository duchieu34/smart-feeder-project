import mqtt from "mqtt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let io;

const MQTT_URL = process.env.MQTT_URL || "mqtt://localhost:1883";

const TOPIC_STATUS = "petfeeder/status";
const TOPIC_FOOD_LEVEL = "petfeeder/food_level";
const TOPIC_FEED_NOW = "petfeeder/feed_now";

const client = mqtt.connect(MQTT_URL);

client.on("connect", () => {
    console.log("[MQTT] Connected to broker: ", MQTT_URL);
    client.subscribe([TOPIC_STATUS, TOPIC_FOOD_LEVEL], (e) => {
        if (e) console.error("[MQTT] Subscibe error: ", e);
        else console.log("[MQTT] Subscribed to to")
    });

    loadSchedules();
});

client.on("message", async (topic, message) => {
    const msg = message.toString();
    console.log(`[MQTT] Received ${topic}: ${msg}`);

    try {
        if (topic === TOPIC_STATUS) {
            const payload = JSON.parse(msg);
            const device = await prisma.device.findUnique({
                where: { deviceId: payload.deviceId }
            });
            if (device) {
                if (io) io.emit("device_status", { deviceId: payload.deviceId, status: payload.status });
            }

        }

        if (topic === TOPIC_FOOD_LEVEL) {
            const payload = JSON.parse(msg);
            const device = await prisma.device.findUnique({
                where: { deviceId: payload.deviceId }
            });
            if (device) {
                const log = await prisma.foodLevelLog.create({
                    data: { deviceId: device.id, level: payload.level }
                });
                if (io) io.emit("food_level", { deviceId: payload.deviceId, level: payload.level });
            }
        }
    } catch (e) {
        console.error("[MQTT] Error processing message: ", e)
    }
});

export const feedNow = (deviceId) => {
    const payload = JSON.stringify({ deviceId });
    client.publish(TOPIC_FEED_NOW, payload, (e) => {
        if (e) console.error("[MQTT] Error sending feed command: ", e);
        else console.log(`[MQTT] Sent feed command to ${deviceId}`);
    });
};

export const setSocketIo = (socketIoInstance) => {
    io = socketIoInstance;
};

const cronJobs = {};

const startCronJobs = (schedule) => {
    try {
        const { id, deviceId, timeCron, amount } = schedule;
        if (!cron.validate(timeCron)) {
            console.error("[CRON] Invalid expression:", timeCron);
            return;
        }

        console.log(`[CRON] Starting job #${id} → ${timeCrom}`);

        cronJobs[id] = cron.schedule(timeCron, () => {
            console.log(`[CRON] Executing feeding job #${id} (device ${deviceId})`);

            const payload = JSON.stringify({
                deviceId,
                amount,
                command: "FEED"
            });

            client.publish(TOPIC_FEED_NOW, payload);
        });
    } catch (e) {
        console.error("[CRON] Internal bug");
    }
};

const loadSchedules = async () => {
    const schedules = await prisma.feedingSchedule.findMany();

    console.log(`[CRON] Loading ${schedules.length} feeding schedules`);

    schedules.forEach(startCronJobs);
};

// export const registerSchedule = async (schedule) => {
//     try{
//         const {deviceId, timeCron, amount} = schedule;

//         const existedSchedule = await prisma.feedingSchedule.findUnique({
//             where: {deviceId, timeCron}
//         });

//         if(existedSchedule) {
//             console.error("[SCHEDULE] Existed schedule", existedSchedule);
//             return;
//         }

//         const newSchedule = await prisma.feedingSchedule.create({
//             data: {deviceId, timeCron, amount}
//         });


//     }
// }