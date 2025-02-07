import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

const RTSP_URL = import.meta.env.VITE_RTSP_URL;

/**
 * @param {object} props
 * @param {React.MutableRefObject<HTMLVideoElement | null>} props.videoRef
 * @param {string} props.deviceId
 * @param {React.CSSProperties} props.style
 * @param {string} props.className
 * @param {boolean} props.muted
 * @param {boolean} props.autoPlay
 * @param {boolean} props.playsInline
 * @param {boolean} props.controls
 * @param {React.ForwardedRef<{captureImage: () => string}>} ref
 */
const CameraStreaming = ({
    id,
    videoRef,
    deviceId,
    style = {},
    className = "",
    muted = false,
    autoPlay = true,
    playsInline = true,
    controls = true,
}) => {
    const [loaded, setLoaded] = useState(null);

    const streamRef = useRef(new MediaStream());
    const webrtcRef = useRef(
        new RTCPeerConnection({
            sdpSemantics: "unified-plan",
        })
    );

    async function startWebrtcPlay() {
        webrtcRef.current.ontrack = (event) => {
            streamRef.current.addTrack(event.track);
            videoRef.current.srcObject = streamRef.current;
        };

        try {
            const codecRes = await axios.get(`${RTSP_URL}/codec/${deviceId}`);
            const data = codecRes.data;
            if (!data) {
                return;
            }
            data.forEach((value) => {
                webrtcRef.current.addTransceiver(value.Type, {
                    direction: "sendrecv",
                });
            });
        } catch (error) {
            console.warn(error);
            return;
        }

        webrtcRef.current.onnegotiationneeded = async () => {
            const offer = await webrtcRef.current.createOffer();
            await webrtcRef.current.setLocalDescription(offer);
            const res = await axios.post(
                `${RTSP_URL}/receiver/${deviceId}`,
                new URLSearchParams({
                    suuid: deviceId,
                    data: btoa(webrtcRef.current.localDescription.sdp),
                })
            );
            try {
                await webrtcRef.current.setRemoteDescription(
                    new RTCSessionDescription({
                        type: "answer",
                        sdp: atob(res.data),
                    })
                );
            } catch (error) {
                console.warn(error);
            }
        };

        const webrtcSendChannel = webrtcRef.current.createDataChannel(
            "rtsptowebSendChannel"
        );
        webrtcSendChannel.onopen = () => {
            webrtcSendChannel.send("ping");
        };
        webrtcSendChannel.onmessage = (event) => {
            console.log(event.data);
        };
        webrtcSendChannel.onclose = () => {
            startWebrtcPlay();
        };
    }

    useEffect(() => {
        if (videoRef.current && loaded === false) {
            startWebrtcPlay();
            setLoaded(true);
        }
    }, [loaded]);

    useEffect(() => {
        if (videoRef.current) {
            startWebrtcPlay();
            setLoaded(true);
        }
    }, [deviceId]);

    return (
        <>
            <video
                ref={videoRef}
                id={id}
                className={className}
                style={style}
                muted={muted}
                autoPlay={autoPlay}
                playsInline={playsInline}
                controls={controls}
            />
        </>
    );
};

export default CameraStreaming;
