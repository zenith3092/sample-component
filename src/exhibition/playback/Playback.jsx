import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { loadVideo } from "./apis/web-server-api";
import {
    getCameraDevices,
    getRecorderDevices,
} from "./apis/control-server-api";

const WEB_SERVER_URL = import.meta.env.VITE_WEB_SERVER_URL;

const Playback = () => {
    const videoRef = useRef(null);

    const [status, setStatus] = useState("");

    const [cameraDevice, setCameraDevice] = useState([]);
    const [recorderDevice, setRecorderDevice] = useState([]);

    const [cameraOptions, setCameraOptions] = useState([]);

    const [deviceId, setDeviceId] = useState("");
    const [channelId, setChannelId] = useState("");
    const [startDate, setStartDate] = useState(moment().format("YYYY-MM-DD"));
    const [startTime, setStartTime] = useState("15:00:00");
    const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
    const [endTime, setEndTime] = useState("15:01:00");
    const [rtspIp, setRtspIp] = useState("");
    const [rtspUsername, setRtspUsername] = useState("");
    const [rtspPassword, setRtspPassword] = useState("");
    const [manufacturer, setManufacturer] = useState("");

    const [actionId, setActionId] = useState("");
    const [filePath, setFilePath] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const allRes = await Promise.allSettled([
                    getCameraDevices(),
                    getRecorderDevices(),
                ]);

                const [cameraResult, recorderResult, enumResult] = allRes;

                if (cameraResult.status === "fulfilled") {
                    if (!cameraResult.value.data.indicator) {
                        alert(cameraResult.value.data.message);
                    } else {
                        setCameraDevice(cameraResult.value.data.content);
                    }
                } else {
                    alert(cameraResult.reason);
                }

                if (recorderResult.status === "fulfilled") {
                    if (!recorderResult.value.data.indicator) {
                        alert(recorderResult.value.data.message);
                    } else {
                        setRecorderDevice(recorderResult.value.data.content);
                    }
                } else {
                    alert(recorderResult.reason);
                }
            } catch (error) {
                alert(error);
            }
        })();
    }, []);

    useEffect(() => {
        if (Array.isArray(cameraDevice)) {
            setCameraOptions(
                cameraDevice.map((device) => ({
                    label: device.device_name,
                    value: device.device_id,
                }))
            );
            if (cameraDevice.length > 1) {
                setDeviceId(cameraDevice[1].device_id);
            }
        }
    }, [cameraDevice]);

    useEffect(() => {
        if (videoRef.current && filePath !== "") {
            videoRef.current.src = `${WEB_SERVER_URL}/${filePath}`;
            videoRef.current.play();
        }
    }, [filePath]);

    useEffect(() => {
        if (deviceId !== "") {
            const camera = cameraDevice.find(
                (device) => device.device_id === deviceId
            );
            if (camera) {
                setChannelId(camera.recorder_configs.camera_channel);

                const recorder = recorderDevice.find(
                    (device) =>
                        device.device_id ===
                        camera.recorder_configs.recorder_device_id
                );
                if (recorder) {
                    setRtspIp(recorder.device_ip);
                    setRtspUsername(recorder.onvif_username);
                    setRtspPassword(recorder.onvif_password);
                    setManufacturer(recorder.manufacturer);
                }
            }
        }
    }, [deviceId, cameraDevice, recorderDevice]);

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div
                className="input-area"
                style={{ display: "flex", flexDirection: "column" }}
            >
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                    type="time"
                    step={1}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <input
                    type="time"
                    value={endTime}
                    step={1}
                    onChange={(e) => setEndTime(e.target.value)}
                />
                <select
                    value={deviceId}
                    onChange={(e) => {
                        setDeviceId(e.target.value);
                    }}
                >
                    <option value="">Select Camera</option>
                    {cameraOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div>{status}</div>

            <div className="control-btns">
                <button
                    onClick={async () => {
                        setStatus("loading...");
                        const res = await loadVideo(
                            channelId,
                            `${startDate} ${startTime}`,
                            `${endDate} ${endTime}`,
                            rtspUsername,
                            rtspPassword,
                            rtspIp,
                            manufacturer
                        );

                        if (res.data.indicator) {
                            setActionId(res.data.content.action_id);
                            setFilePath(res.data.content.filepath);
                            setStatus("");
                        } else {
                            alert(res.data.message);
                            setStatus("");
                        }
                    }}
                >
                    Submit
                </button>
                <button
                    onClick={() => {
                        if (actionId !== "") {
                            const a = document.createElement("a");
                            a.href = `${WEB_SERVER_URL}/api/video/download_video?file=${filePath}`;
                            a.download = `video_${actionId}.mp4`;
                            a.click();

                            a.remove();
                        }
                    }}
                >
                    Download
                </button>
            </div>

            <video
                ref={videoRef}
                controls
                style={{ width: "640px", height: "360px" }}
            />
        </div>
    );
};

export default Playback;
