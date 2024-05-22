"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios, { AxiosError } from "axios";

const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError !== undefined;
};

// Define an interface for the video object
interface Video {
  _id: string;
  url: string;
  sentence: string;
  startTime: number;
  endTime: number;
}

const API_BASE_URL =
process.env.REACT_APP_API_BASE_URL ||
"https://anisongvocab-efb991b7c074.herokuapp.com"; // Ensure this matches your server's base URL


const fetchVideo = async (currentVideoId: string) => {
  const url = currentVideoId
    ? `${API_BASE_URL}/api/random-video?currentVideoId=${currentVideoId}`
    : `${API_BASE_URL}/api/random-video`;

  try {
    const response = await axios.get<Video>(url, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching random video:", error);
    throw error;
  }
};

const submitGuess = async (videoId: string, guess: string) => {
  const url = `${API_BASE_URL}/api/videos/${videoId}/guess`;

  try {
    const response = await axios.post(url, { guess }, { headers: { "Content-Type": "application/json" } });
    return response.data;
  } catch (error) {
    console.error("Error submitting guess:", error);
    if (isAxiosError(error)) {
      console.error("Error Response:", error.response?.data);
    }
    throw error;
  }
};

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
  const [showPlayButton, setShowPlayButton] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const initialFetchRef = useRef(true);

  const handleFetchVideo = useCallback(async () => {
    try {
      const data = await fetchVideo(video?._id || "");
      setVideo(data);
      setSentence(data.sentence);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setIsCorrect(null);
      setGuess("");
      setMetadataLoaded(false);
      setIsBuffering(true);
      setCanPlayThrough(false);
      setShowPlayButton(true);
    } catch (error) {
      console.error("Error in handleFetchVideo:", error);
    }
  }, [video]);

  const handleGuessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(event.target.value);
  };

  const handleGuessSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (isCorrect !== null) {
      handleFetchVideo();
      return;
    }

    if (!video || !guess) {
      console.error("Missing video or guess");
      return;
    }

    try {
      const result = await submitGuess(video._id, guess);
      setIsCorrect(result.correct);
    } catch (error) {
      console.error("Error in handleGuessSubmit:", error);
    }
  }, [isCorrect, video, guess, handleFetchVideo]);

  const playVideo = useCallback(() => {
    const videoElement = videoRef.current;
    if (videoElement && metadataLoaded && canPlayThrough && videoElement.paused) {
      setShowPlayButton(false);
      if (startTime !== null) {
        videoElement.currentTime = startTime / 1000;
      }
      videoElement.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }
  }, [metadataLoaded, canPlayThrough, startTime]);

  const handleVideoClick = () => {
    playVideo();
  };

  const handleTimeUpdate = () => {
    const videoElement = videoRef.current;
    if (videoElement && startTime !== null && endTime !== null) {
      if (videoElement.currentTime > endTime / 1000) {
        videoElement.pause();
        setShowPlayButton(true);
      }
    }
  };

  useEffect(() => {
    if (initialFetchRef.current) {
      handleFetchVideo();
      initialFetchRef.current = false;
    }
  }, [handleFetchVideo]);

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
      videoElement.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        videoElement.removeEventListener("canplaythrough", handleCanPlayThrough);
        videoElement.removeEventListener("waiting", handleWaiting);
        videoElement.removeEventListener("playing", handlePlaying);
        videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [video, playVideo, startTime, endTime]);

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
              controls // Add controls to help debug playback issues
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
            {showPlayButton && (
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={handleVideoClick}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.752 11.168l-7.148-4.29A1 1 0 006 7.617v8.766a1 1 0 001.604.823l7.148-4.29a1 1 0 000-1.651z"
                  />
                </svg>
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