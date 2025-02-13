import axios from "axios";

const CONTROL_SERVER_URL = import.meta.env.VITE_CONTROL_SERVER_URL;
const TOKEN = import.meta.env.VITE_TOKEN;

async function getCameraDevices() {
    return axios.get(`${CONTROL_SERVER_URL}/api/setting/camera_device`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });
}

async function getRecorderDevices() {
    return axios.get(`${CONTROL_SERVER_URL}/api/setting/recorder_device`, {
        headers: {
            Authorization: `Bearer ${TOKEN}`,
        },
    });
}

export { getCameraDevices, getRecorderDevices };
