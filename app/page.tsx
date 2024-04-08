"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Camera,
  MoonIcon,
  Disc2Icon,
  SunIcon,
  Video,
  Volume2,
  ImageIcon,
  CctvIcon,
} from "lucide-react";
import Image from "next/image";

import Webcam from "react-webcam";
import { Rings } from "react-loader-spinner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import SocialMediaLinks from "@/components/social-links";

import { beep } from "@/utils/audio";

import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";

import { ModeToggle } from "@/components/theme-toggle";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;
const HomePage = (props: Props) => {
  // Theme
  const { setTheme } = useTheme();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [videoFeedScan, setvideoFeedScan] = useState(true);
  const toggleRightDivisionVisibility = () => {
    setvideoFeedScan(!videoFeedScan);
  };

  // Initialize the media recorder
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecorderRef.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecorderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    setLoading(true);
    initModel();
  }, []);

  // Load model
  // Set it in a state varaible
  async function initModel() {
    const loadedModel: ObjectDetection = await cocossd.load({
      base: "mobilenet_v2",
    });
    setModel(loadedModel);
  }

  return (
    <div className="flex h-screen">
      {/* Left division - webcam and Canvas  */}
      <div className="relative w-3/4">
        {/* Toggle visibility based on state */}
        <div className="relative h-full w-full p-4">
          <Webcam
            ref={webcamRef}
            // mirrored={mirrored}
            className="h-full w-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          ></canvas>
        </div>
      </div>

      {/* Righ division - container for buttion panel and wiki secion  */}
      <div className="flex flex-row w-1/4">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          {/* top secion  */}
          <div className="flex flex-col gap-2">
            {videoFeedScan ? (
              <Button
                title="Switch to ImageScan"
                variant={"outline"}
                size={"icon"}
                onClick={toggleRightDivisionVisibility}
              >
                <ImageIcon />
              </Button>
            ) : (
              <Button
                title="Switch to VideoScan"
                variant={"outline"}
                size={"icon"}
                onClick={toggleRightDivisionVisibility}
              >
                <CctvIcon />
              </Button>
            )}
            <ModeToggle />
            <Separator className="my-2" />
          </div>

          {/* Middle section  */}

          <div className="flex flex-col gap-4"></div>
          {/* Bottom Secion  */}
          <div className="flex flex-col gap-2"></div>
        </div>
        {/* Features Guide Section  */}
        {/* <div className="h-full flex-1 py-4 px-2 overflow-y-scroll"> */}
        <div className={`h-full flex-1 py-4 px-2 overflow-y-scroll`}></div>
      </div>
      {loading && (
        <div className="z-50 absolute w-full h-full flex items-center justify-center bg-primary-foreground">
          Getting things ready . . . <Rings height={50} color="red" />
        </div>
      )}
    </div>
  );

  // Handler functions
  // Screenshots Function
  function userPromptScreenshot() {
    // take picture
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      console.log(imgSrc);
      const blob = base64toBlob(imgSrc);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formatDate(new Date())}.png`;
      a.click();
    }
    // Save it to downloads
  }
  // Recording Functions
  function userPromptRecord() {
    if (!webcamRef.current) {
      toast("Camera is not found. Please refresh.");
    }

    if (mediaRecorderRef.current?.state == "recording") {
      // check if recording
      // then stop recording
      // and save to downloads
      mediaRecorderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
    } else {
      // if not recording
      // start recording
      startRecording(false);
    }
  }
  // Start Recording Function
  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }
  // Auto Recording Function
  function toggleAutoRecord() {
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);
      toast("Autorecord disabled");
      // show toast to user to notify the change
    } else {
      setAutoRecordEnabled(true);
      toast("Autorecord enabled");
      // show toast
    }
  }
};
export default HomePage;

//  Functions resizeCanvas FormatData base64toBlob
function resizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  webcamRef: React.RefObject<Webcam>
) {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;

  if (canvas && video) {
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }
}
function formatDate(d: Date) {
  const formattedDate =
    [
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getDate().toString().padStart(2, "0"),
      d.getFullYear(),
    ].join("-") +
    " " +
    [
      d.getHours().toString().padStart(2, "0"),
      d.getMinutes().toString().padStart(2, "0"),
      d.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}
function base64toBlob(base64Data: any) {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteCharacters.length);
  const byteArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: "image/png" });
}
