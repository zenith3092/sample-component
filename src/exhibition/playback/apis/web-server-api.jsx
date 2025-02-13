import axios from "axios";

const WEB_SERVER_URL = import.meta.env.VITE_WEB_SERVER_URL;

async function loadVideo(
    channel_id,
    start_time,
    end_time,
    rtsp_username,
    rtsp_password,
    rtsp_ip,
    manufacturer
) {
    return axios.post(
        `${WEB_SERVER_URL}/api/video/load_video`,
        {
            channel_id,
            start_time,
            end_time,
            rtsp_username,
            rtsp_password,
            rtsp_ip,
            manufacturer,
        },
        {
            timeout: 120000,
        }
    );
}

export { loadVideo };
