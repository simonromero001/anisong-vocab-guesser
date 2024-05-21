"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// Define an interface for the video object
interface Video {
  _id: string;
  url: string;
  sentence: string;
  startTime: number;
  endTime: number;
}

export default function Home() {
  const [video, setVideo] = useState<Video | null>(null);
  const [sentence, setSentence] = useState("");
  const [guess, setGuess] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [canPlayThrough, setCanPlayThrough] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const initialFetchRef = useRef(true);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL ||
    "https://anisongvocab-efb991b7c074.herokuapp.com"; // Ensure this matches your server's base URL

  const fetchVideo = useCallback(() => {
    const currentVideoId = video ? video._id : "";
    const url = currentVideoId
      ? `${API_BASE_URL}/api/random-video?currentVideoId=${currentVideoId}`
      : `${API_BASE_URL}/api/random-video`;

    console.log("Fetching video from URL:", url);

    axios
      .get<Video>(url, { headers: { "Content-Type": "application/json" } })
      .then((response) => {
        const data = response.data;
        setVideo(data);
        setSentence(data.sentence);
        setStartTime(data.startTime);
        setEndTime(data.endTime);
        setIsCorrect(null);
        setGuess("");
        setMetadataLoaded(false);
        setIsBuffering(true);
        setCanPlayThrough(false);
      })
      .catch((err) => {
        console.error("Error fetching random video:", err);
      });
  }, [API_BASE_URL, video]);

  const handleGuessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(event.target.value);
  };

  const handleGuessSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
  
    if (isCorrect !== null) {
      fetchVideo();
      return;
    }
  
    if (!video || !guess) {
      console.error("Missing video or guess");
      return;
    }
  
    const url = `${API_BASE_URL}/api/videos/${video._id}/guess`;
  
    try {
      const response = await axios.post(url, { guess }, { headers: { "Content-Type": "application/json" } });
      const result = response.data;
      setIsCorrect(result.correct);
    } catch (error) {
      console.error("Error submitting guess:", error);
      if (error.response) {
        console.error("Error Response:", error.response.data);
      }
    }
  };

  const playVideo = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && metadataLoaded && canPlayThrough && videoElement.paused) {
      if (startTime !== null) {
        videoElement.currentTime = startTime / 1000;
      }
      videoElement.play().catch((error) => {
        console.error("Error playing video:", error);
      });

      if (startTime !== null && endTime !== null) {
        const duration = (endTime - startTime) / 1000;
        setTimeout(() => {
          videoElement.pause();
        }, duration * 1000);
      }
    }
  }, [metadataLoaded, canPlayThrough, startTime, endTime]);

  const handleVideoClick = () => {
    playVideo();
  };

  useEffect(() => {
    if (initialFetchRef.current) {
      fetchVideo();
      initialFetchRef.current = false;
    }
  }, [fetchVideo]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      const handleLoadedMetadata = () => {
        setMetadataLoaded(true);
        setIsBuffering(false);
      };

      const handleCanPlayThrough = () => {
        setCanPlayThrough(true);
        setIsBuffering(false);
        playVideo();
      };

      const handleWaiting = () => {
        setIsBuffering(true);
      };

      const handlePlaying = () => {
        setIsBuffering(false);
      };

      videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      videoElement.addEventListener("canplaythrough", handleCanPlayThrough);
      videoElement.addEventListener("waiting", handleWaiting);
      videoElement.addEventListener("playing", handlePlaying);

      return () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.removeEventListener("canplaythrough", handleCanPlayThrough);
        videoElement.removeEventListener("waiting", handleWaiting);
        videoElement.removeEventListener("playing", handlePlaying);
      };
    }
  }, [video, playVideo]);

  return (
    <main>
      <div className="aspect-w-16 aspect-h-9 w-3/4 max-w-s mx-auto relative">
        {video ? (
          <>
            <video
              ref={videoRef}
              onClick={handleVideoClick}
              className="w-full h-full object-contain mx-auto bg-black rounded"
              src={video.url}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div
                  className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-white"
                  role="status"
                ></div>
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </>
        ) : (
          <p>Loading video...</p>
        )}
      </div>
      <div className="text-center mt-8">
        <p className="text-xl mb-8">{sentence}</p>
        <form onSubmit={handleGuessSubmit} className="inline-block">
          <input
            type="text"
            value={guess}
            onChange={handleGuessChange}
            className="border-2 border-gray-300 rounded-lg p-2 text-xl mr-2"
            placeholder="Type your guess here"
          />
          <button
            type="submit"
            className={`px-6 py-2 text-lg font-semibold rounded-lg ${
              isCorrect === null
                ? "bg-blue-500 text-white"
                : isCorrect
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {isCorrect === null ? "Submit" : isCorrect ? "正解！" : "不正解！"}
          </button>
        </form>
      </div>
    </main>
  );
}
