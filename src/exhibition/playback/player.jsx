import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { FaPlay, FaPause, FaDownload } from "react-icons/fa";
import moment from "moment";
import axios from "axios";
import "./player.scss";

/**
 * Playback player component.
 *
 * @param {Object} props Component properties.
 * @param {React.MutableRefObject<HTMLVideoElement>} props.videoRef Video reference.
 * @param {string} props.startStamp Start timestamp.
 * @param {string} props.endStamp End timestamp.
 * @param {React.CSSProperties} props.videoStyle Video style.
 * @param {React.CSSProperties} props.maskStyle Mask style.

 */
const Player = ({
    videoRef,
    startStamp = "",
    endStamp = "",
    videoStyle = {},
    maskStyle = {},
}) => {
    const baseBgColor = "#e9e9e9";
    const bufferBgColor = "#a1a1a1";
    const playedBgColor = "#fdffbe";

    const dateFormat = "YYYY-MM-DD";
    const timeFormat = "HH:mm:ss";

    const iconRef = useRef(null);
    const inputRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [bufferProgress, setBufferProgress] = useState(0);
    const [playingProgress, setPlayingProgress] = useState(0);

    const [momentStart, setMomentStart] = useState(moment(startStamp));
    const [momentEnd, setMomentEnd] = useState(moment(endStamp));
    const [currentDate, setCurrentDate] = useState("");
    const [currentTime, setCurrentTime] = useState("");
    const [fontSize, setFontSize] = useState({
        edge: 0,
        middle: 0,
    });

    useEffect(() => {
        if (!startStamp || !endStamp) {
            throw new Error("Start and end time are required.");
        }

        const start = moment(startStamp);
        const end = moment(endStamp);

        if (!start.isValid() || !end.isValid()) {
            throw new Error("Invalid start or end time.");
        }

        setCurrentDate(start.format(dateFormat));
        setCurrentTime(start.format(timeFormat));

        setMomentStart(start);
        setMomentEnd(end);
    }, [startStamp, endStamp]);

    useEffect(() => {
        const duration = videoRef.current.duration;

        const playedMilliSeconds = ((duration * playingProgress) / 100) * 1000;

        const currentMoment = moment(
            momentStart.clone().add(playedMilliSeconds, "ms")
        );
        setCurrentDate(currentMoment.format(dateFormat));
        setCurrentTime(currentMoment.format(timeFormat));
    }, [playingProgress]);

    useEffect(() => {
        if (iconRef.current) {
            const svg = iconRef.current.childNodes[0];

            setFontSize({
                edge: svg.clientHeight * 0.45,
                middle: svg.clientHeight * 0.55,
            });

            if (inputRef.current) {
                const newSize = svg.clientHeight * 0.75;
                inputRef.current.style.setProperty(
                    "--timeline-size",
                    `${newSize}px`
                );
            }
        }
    }, []);

    return (
        <div className="playback-player">
            <video
                className="playback-video"
                ref={videoRef}
                style={videoStyle}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                    if (videoRef.current && videoRef.current.src) {
                        const duration = videoRef.current.duration;

                        if (
                            duration === 0 ||
                            videoRef.current.buffered.length === 0
                        )
                            return;

                        const bufferEnd = videoRef.current.buffered.end(
                            videoRef.current.buffered.length - 1
                        );
                        setBufferProgress((bufferEnd / duration) * 100);

                        const currentTime = videoRef.current.currentTime;
                        setPlayingProgress((currentTime / duration) * 100);
                    }
                }}
            />
            <div className="playback-controls" style={maskStyle}>
                <div className="playback-mask"></div>
                <div className="playback-functions">
                    <div className="playback-play-pause">
                        <div
                            className="playback-function-btn"
                            ref={iconRef}
                            onClick={() => {
                                if (isPlaying) {
                                    videoRef.current?.pause();
                                } else {
                                    videoRef.current?.play();
                                }
                            }}
                        >
                            {isPlaying ? (
                                <FaPause size={24} />
                            ) : (
                                <FaPlay size={24} />
                            )}
                        </div>
                    </div>
                    <div className="playback-timeline">
                        <div className="playback-timeline-time">
                            <div
                                className="playback-timeline-start playback-timeline-gap"
                                style={{ fontSize: fontSize.edge }}
                            >
                                <div className="playback-timeline-date-display">
                                    {momentStart.format(dateFormat)}
                                </div>
                                <div className="playback-timeline-time-display">
                                    {momentStart.format(timeFormat)}
                                </div>
                            </div>
                            <div
                                className="playback-timeline-progress"
                                style={{ fontSize: fontSize.middle }}
                            >
                                <div className="playback-timeline-date-display">
                                    {currentDate}
                                </div>
                                <div className="playback-timeline-time-display">
                                    {currentTime}
                                </div>
                            </div>
                            <div
                                className="playback-timeline-end playback-timeline-gap"
                                style={{ fontSize: fontSize.edge }}
                            >
                                <div className="playback-timeline-date-display">
                                    {momentEnd.format(dateFormat)}
                                </div>
                                <div className="playback-timeline-time-display">
                                    {momentEnd.format(timeFormat)}
                                </div>
                            </div>
                        </div>
                        <div className="playback-timeline-bar">
                            <div className="playback-timeline-bar-wrapper">
                                <input
                                    className="playback-timeline-bar-input"
                                    ref={inputRef}
                                    type="range"
                                    min="0"
                                    max="100"
                                    step={0.001}
                                    value={playingProgress}
                                    onChange={(e) => {
                                        setPlayingProgress(e.target.value);

                                        if (!videoRef.current) {
                                            return;
                                        }

                                        const duration =
                                            videoRef.current.duration;

                                        videoRef.current.currentTime =
                                            e.target.value === 0
                                                ? 0
                                                : (duration * e.target.value) /
                                                  100;
                                    }}
                                    style={{
                                        background:
                                            bufferProgress - playingProgress > 0
                                                ? `linear-gradient(to right,  ${playedBgColor} 0% ${
                                                      playingProgress > 67
                                                          ? playingProgress - 1
                                                          : playingProgress < 33
                                                          ? playingProgress + 1
                                                          : playingProgress
                                                  }%, ${bufferBgColor} ${playingProgress}% ${playingProgress}%, ${bufferBgColor} ${bufferProgress}%,${baseBgColor} ${bufferProgress}%, ${baseBgColor} 100%)`
                                                : `linear-gradient(to right, ${playedBgColor} 0% ${
                                                      playingProgress > 67
                                                          ? playingProgress - 1
                                                          : playingProgress < 33
                                                          ? playingProgress + 1
                                                          : playingProgress
                                                  }%, ${baseBgColor} ${playingProgress}%, ${baseBgColor} 100%)`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="playback-timeline-progress"></div>
                    </div>
                    <div className="playback-download">
                        <div
                            className="playback-function-btn"
                            onClick={async (e) => {
                                e.stopPropagation();

                                if (videoRef.current) {
                                    const a = document.createElement("a");
                                    a.href = videoRef.current.src;
                                    a.download = "video.mp4";

                                    a.click();
                                    a.remove();
                                }
                            }}
                        >
                            <FaDownload size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
