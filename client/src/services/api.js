import axios from 'axios';

const API_URL = 'http://localhost:3050/api';

const api = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

api.getSchedules = (deviceId) => {
    return api.get(`/schedules/devices/${deviceId}`);
};

api.createSchedule = (deviceId, data) => {
    return api.post(`/schedules/devices/${deviceId}`, {
        ...data,
        deviceId: deviceId
    });
};

api.deleteSchedule = (scheduleId) => {
    return api.delete(`/schedules/${scheduleId}`);
};

api.activateAccount = (token) => {
    return api.get(`/auth/activate/${token}`)
}

export default api;