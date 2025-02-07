import React, { useRef, useState, useEffect } from "react";
import CameraStreaming from "./camera-streaming";
import moment from "moment";

const AutoCapture = () => {
    const video1Ref = useRef(null);
    const video2Ref = useRef(null);
    const video3Ref = useRef(null);

    const img1Ref = useRef(null);
    const img2Ref = useRef(null);
    const img3Ref = useRef(null);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [goToIdx, setGoToIdx] = useState(0);

    const videoWidth = 352;
    const videoHeight = videoWidth * (9 / 16);

    const displayNumber = 3;

    const schedule = [
        "CAMERA-201-1",
        "CAMERA-202-2",
        "CAMERA-203-3",
        "CAMERA-204-4",
        "CAMERA-205-5",
        "CAMERA-206-6",
        "CAMERA-207-7",
    ];

    const numbers = [2, 3, 3, 3, 3, 3, 2];

    useEffect(() => {
        if (img1Ref.current) img1Ref.current.src = "";
        if (img2Ref.current) img2Ref.current.src = "";
        if (img3Ref.current) img3Ref.current.src = "";

        const s = setInterval(() => {
            if (!video2Ref.current || !img2Ref.current) {
                return;
            } else {
                clearInterval(s);
                /**
                 * @type {HTMLVideoElement}
                 */
                const video = video2Ref.current;

                const canvas = document.createElement("canvas");
                canvas.width = 1920;
                canvas.height = canvas.width * (9 / 16);

                const ctx = canvas.getContext("2d");

                const captureImage = () => {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    return canvas.toDataURL("image/png", 1.0);
                };

                if (video.readyState === 4 && video.networkState === 2) {
                    const i = setInterval(() => {
                        const dataUrl = captureImage();
                        if (dataUrl) {
                            setTimeout(() => {
                                clearInterval(i);
                                img2Ref.current.src = dataUrl;
                            }, 5);
                        }
                    }, 5);
                } else {
                    video.onloadedmetadata = () => {
                        const i = setInterval(() => {
                            const dataUrl = captureImage();
                            if (dataUrl) {
                                setTimeout(() => {
                                    clearInterval(i);
                                    img2Ref.current.src = dataUrl;
                                }, 5);
                            }
                        }, 5);
                    };
                }
            }
        }, 5);
    }, [currentIdx]);

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    marginBottom: "50px",
                }}
            >
                {[
                    ...(currentIdx === 0
                        ? schedule.slice(currentIdx, numbers[currentIdx])
                        : currentIdx === schedule.length - 1
                        ? schedule.slice(currentIdx - 1, schedule.length)
                        : schedule.slice(
                              currentIdx - 1,
                              currentIdx + numbers[currentIdx] - 1
                          )),
                ].map((deviceId, idx) => {
                    const gap = numbers[currentIdx] - displayNumber;

                    let showingIdx = idx;
                    if (currentIdx === 0) {
                        showingIdx = idx - gap;
                    }

                    const [videoRef, imgRef] =
                        showingIdx === 0
                            ? [video1Ref, img1Ref]
                            : showingIdx === 1
                            ? [video2Ref, img2Ref]
                            : [video3Ref, img3Ref];

                    return (
                        <div
                            key={deviceId}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <CameraStreaming
                                id={"video" + showingIdx}
                                deviceId={deviceId}
                                videoRef={videoRef}
                                style={{
                                    width: `${videoWidth}px`,
                                    height: `${videoHeight}px`,
                                    margin: "15px 15px",
                                }}
                            />
                            <img
                                id={"img" + showingIdx}
                                ref={imgRef}
                                style={{
                                    width: `${videoWidth}px`,
                                    height: `${videoHeight}px`,
                                    margin: "15px 15px",
                                    border: "1px solid black",
                                    visibility:
                                        showingIdx === 1 ? "visible" : "hidden",
                                }}
                            />
                        </div>
                    );
                })}
            </div>
            <div
                style={{
                    display: "flex",
                    marginBottom: "50px",
                    justifyContent: "center",
                }}
            >
                <div>
                    <select
                        onChange={(e) => setGoToIdx(parseInt(e.target.value))}
                        style={{ width: "200px" }}
                    >
                        {schedule.map((deviceId, idx) => (
                            <option key={deviceId} value={idx}>
                                {deviceId}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={() => {
                            setCurrentIdx(goToIdx);
                        }}
                    >
                        Switch
                    </button>
                    <button
                        style={{ margin: "0 15px" }}
                        onClick={() => {
                            setCurrentIdx((currentIdx + 1) % schedule.length);
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutoCapture;
