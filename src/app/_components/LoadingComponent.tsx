"use client";

import { NewtonsCradle } from "ldrs/react";
import "ldrs/react/NewtonsCradle.css";

import { useEffect, useState } from "react";

const LoadingComponent = () => {
  const loadingSpeeches = [
    "CORDY is digging through mud for this...",
    "The server is getting a snack... be patient.",
    "Just a second... CORDY is tying its shoes.",
    "Loading... CORDY is hunting for data.",
    "Hang tight... CORDY is bribing the server.",
    "Don't worry, CORDY is on a coffee break.",
    "Hold on, CORDY is negotiating with the internet.",
    "Almost there... CORDY is assembling the data puzzle.",
    "Getting things ready... CORDY is petting the server.",
    "Data is coming... CORDY is performing a magic trick.",
  ];
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  useEffect(() => {
    // Set initial random loading message
    setLoadingMessage(
      loadingSpeeches[Math.floor(Math.random() * loadingSpeeches.length)] ??
        "Loading...",
    );

    // Change message every 3 seconds
    const intervalId = setInterval(() => {
      return setLoadingMessage(
        loadingSpeeches[Math.floor(Math.random() * loadingSpeeches.length)] ??
          "Loading...",
      );
    }, 3000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center">
      <NewtonsCradle size="150" speed="1.4" color="#e84855" />
      <p className="my-4 text-center text-lg font-semibold text-black">
        {loadingMessage}
      </p>
    </div>
  );
};
export default LoadingComponent;
