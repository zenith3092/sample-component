import { useRef, useState } from "react";

const TOKEN = import.meta.env.VITE_TOKEN;
const CAMERA_IP = import.meta.env.VITE_CAMERA_IP;
const CAMERA_USERNAME = import.meta.env.VITE_CAMERA_USERNAME;
const CAMERA_PASSWORD = import.meta.env.VITE_CAMERA_PASSWORD;
const CAMERA_WS_URL = import.meta.env.VITE_CAMERA_WS_URL;
const CAMERA_WS_CLIENT = import.meta.env.VITE_CAMERA_WS_CLIENT;

const AudioSender = () => {
    const audioContextRef = useRef(null);
    const workletNodeRef = useRef(null);
    const wsRef = useRef(null);
    const streamRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    // 開始錄音
    const startRecording = async () => {
        if (isRecording) return; // 避免重複開啟
        let authIdentityResolver = null;
        let audioCheckResolver = null;

        wsRef.current = new WebSocket(
            `${CAMERA_WS_URL}?clientId=${CAMERA_WS_CLIENT}`
        );

        wsRef.current.onopen = () => {
            console.log("WebSocket 已連線");

            wsRef.current.send(
                JSON.stringify({
                    operation: "AUTH_IDENTITY",
                    content: {
                        token: TOKEN,
                    },
                })
            );
        };

        wsRef.current.onclose = () => {
            console.log("WebSocket 已關閉");
        };

        wsRef.current.onerror = (error) => {
            console.log("WebSocket 發生錯誤", error);
        };

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.body.operation) {
                case "AUTH_IDENTITY":
                    if (message.result.indicator) {
                        if (authIdentityResolver) {
                            authIdentityResolver();
                        }
                    } else {
                        console.log(message.result.message);
                        wsRef.current.close();
                    }
                    break;
                case "AUDIO_CHECK":
                    if (message.result.indicator) {
                        if (audioCheckResolver) {
                            audioCheckResolver();
                        }
                    } else {
                        console.log(message.result.message);
                        wsRef.current.close();
                    }
                    break;
                default:
                    break;
            }
        };

        await new Promise((resolve) => {
            authIdentityResolver = resolve;
        });

        console.log("通過 AUTH_IDENTITY");

        wsRef.current.send(
            JSON.stringify({
                operation: "AUDIO_CHECK",
                content: {
                    device_id: "CAMERA-162-14",
                    ip: CAMERA_IP,
                    username: CAMERA_USERNAME,
                    password: CAMERA_PASSWORD,
                    endpoint: "/profile1",
                },
            })
        );

        await new Promise((resolve) => {
            audioCheckResolver = resolve;
        });

        console.log("通過 AUDIO_CHECK");

        audioContextRef.current = new AudioContext({ sampleRate: 8000 });
        await audioContextRef.current.audioWorklet.addModule(
            "/workletProcessor.js"
        );

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });
        streamRef.current = stream;
        const source = audioContextRef.current.createMediaStreamSource(stream);

        const workletNode = new AudioWorkletNode(
            audioContextRef.current,
            "microphone-processor"
        );
        workletNodeRef.current = workletNode;
        source.connect(workletNode);

        workletNode.port.onmessage = (event) => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const arrayBuffer = event.data;
                const uint8Array = new Uint8Array(arrayBuffer);
                const base64String = btoa(String.fromCharCode(...uint8Array));

                const message = {
                    operation: "AUDIO_STREAM",
                    content: {
                        data_string: base64String,
                    },
                };

                wsRef.current.send(JSON.stringify(message));
            }
        };

        setIsRecording(true);
    };

    // 停止錄音
    const stopRecording = () => {
        if (!isRecording) return;

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);

        if (wsRef.current) {
            wsRef.current.close();
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <div>
                <button onClick={startRecording} disabled={isRecording}>
                    開始講話
                </button>
                <button onClick={stopRecording} disabled={!isRecording}>
                    結束講話
                </button>
            </div>
            <div>{isRecording ? "錄音中" : "未錄音"}</div>
        </div>
    );
};

export default AudioSender;
