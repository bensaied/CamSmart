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
import { drawOnCanvas } from "@/utils/draw";
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
  // Disable loading component when the model is loaded
  useEffect(() => {
    if (model) {
      setLoading(false);
    }
  }, [model]);

  // Run Prediction : Detection Process
  async function runPrediction() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(
        webcamRef.current.video
      );

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(predictions, canvasRef.current?.getContext("2d"));

      // let isPersonOrObject: boolean = false;
      if (predictions.length > 0) {
        // predictions.forEach((prediction) => {
        //   isPersonOrObject = prediction.class === "person" ;
        // });

        if (autoRecordEnabled) {
          startRecording(true);
        }
      }
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 100);

    return () => clearInterval(interval);
  }, [webcamRef.current, model, autoRecordEnabled, runPrediction]);

  // Return Logic of the HomePage
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
          {/* Top secion  */}
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
          <div className="flex flex-col gap-4">
            {videoFeedScan ? <Separator className="my-2" /> : ""}
            {videoFeedScan ? (
              <Button
                title="Take a Picture"
                variant={"outline"}
                size={"icon"}
                onClick={userPromptScreenshot}
              >
                <Camera />
              </Button>
            ) : (
              ""
            )}{" "}
            {videoFeedScan ? (
              <Button
                title="Manual Video Recording"
                variant={isRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={userPromptRecord}
              >
                <Video />
              </Button>
            ) : (
              ""
            )}
            {videoFeedScan ? (
              <Button
                title="Enable/Disable Auto Record"
                variant={autoRecordEnabled ? "destructive" : "outline"}
                size={"icon"}
                onClick={toggleAutoRecord}
              >
                {autoRecordEnabled ? (
                  <Rings color="white" height={45} />
                ) : (
                  <Disc2Icon />
                )}
              </Button>
            ) : (
              ""
            )}
            {videoFeedScan ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    title="Volume of the notifications"
                    variant={"outline"}
                    size={"icon"}
                  >
                    <Volume2 />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Slider
                    max={1}
                    min={0}
                    step={0.2}
                    defaultValue={[volume]}
                    onValueCommit={(val) => {
                      setVolume(val[0]);
                      beep(val[0]);
                    }}
                  />
                </PopoverContent>
              </Popover>
            ) : (
              ""
            )}
            {videoFeedScan ? <Separator className="my-2" /> : ""}
          </div>
          {/* Bottom Secion  */}
          <div className="flex flex-col gap-2"></div>
        </div>
        {/* Features Guide VideoScan Section  */}
        {/* <div className="h-full flex-1 py-4 px-2 overflow-y-scroll"> */}
        <div className={`h-full flex-1 py-4 px-2 overflow-y-scroll`}>
          <RenderFeatureHighlightsSection />
        </div>
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
  // Inner-components for VideoScan Section
  function RenderFeatureHighlightsSection() {
    return (
      <div className="text-xs text-muted-foreground flex flex-col items-center">
        <Image
          title="CamSmart"
          alt="CamSmart Logo"
          src="/favicon.ico"
          width={100}
          height={100}
        ></Image>
        {videoFeedScan ? (
          <ul
            className="space-y-4
           "
          >
            <Separator className="h-2" />

            <li className="flex justify-center">
              <strong className="text-sm text-blue-700">VideoScan</strong>
            </li>
            <li className="flex flex-col items-center">
              <strong className="text-xs">
                Live Camera Feed Highlighting 🎨
              </strong>
              <p>
                Highlights persons in{" "}
                <span style={{ color: "#EE6310" }}>orange</span> and other
                objects in <span style={{ color: "#BCD96E" }}>green</span>.
              </p>
            </li>
            <Separator className="h-2" />
            <li className="flex flex-col items-center">
              <strong>Dark Mode/Sys Theme 🌗</strong>
              <p>Toggle between dark mode and system theme.</p>
              <div className="flex justify-center">
                <Button
                  className="my-2 h-6 w-6"
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setTheme("light")}
                >
                  <SunIcon size={14} />
                </Button>{" "}
                <span className="my-2 mx-2"> / </span>
                <Button
                  className="my-2 h-6 w-6"
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon size={14} />
                </Button>
              </div>
            </li>

            <Separator />
            <li>
              <strong>Take Pictures 📸</strong>
              <p>Capture snapshots at any moment from the video feed.</p>
              <Button
                className="h-6 w-6 my-2"
                variant={"outline"}
                size={"icon"}
                onClick={userPromptScreenshot}
              >
                <Camera size={14} />
              </Button>
            </li>
            <li>
              <strong>Manual Video Recording 📽️</strong>
              <p>Manually record video clips as needed.</p>
              <Button
                className="h-6 w-6 my-2"
                variant={isRecording ? "destructive" : "outline"}
                size={"icon"}
                onClick={userPromptRecord}
              >
                <Video size={14} />
              </Button>
            </li>
            <li>
              <strong>Enable/Disable Auto Record 🚫</strong>
              <p>
                Option to enable/disable automatic video recording whenever
                required.
              </p>
              <Button
                className="h-6 w-6 my-2"
                variant={autoRecordEnabled ? "destructive" : "outline"}
                size={"icon"}
                onClick={toggleAutoRecord}
              >
                {autoRecordEnabled ? (
                  <Rings color="white" height={30} />
                ) : (
                  <Disc2Icon size={14} />
                )}
              </Button>
            </li>
            <li>
              <strong>Volume Slider 🔊</strong>
              <p>Adjust the volume level of the notifications.</p>
            </li>

            <Separator />
            <li className="space-y-4">
              <strong>Share your thoughts 💬 </strong>
              <SocialMediaLinks />
              <br />
              <br />
              <br />
            </li>
          </ul>
        ) : (
          <ul className="space-y-4">
            <Separator className="h-2" />
            <li className="flex justify-center">
              <strong className="text-sm text-purple-300">ImageScan</strong>
            </li>
            <li className="flex flex-col items-center">
              <strong className="text-xs">
                Image Analysis and Object Detection 🃏{" "}
              </strong>
              <p>
                Upload an image to receive a detailed{" "}
                <span style={{ color: "#ffdd00" }}>report</span> on detected
                objects.
              </p>
            </li>
            <Separator className="h-2" />
            <li className="flex flex-col items-center">
              <strong>Dark Mode/Sys Theme 🌗</strong>
              <p>Toggle between dark mode and system theme.</p>
              <div className="flex justify-center">
                <Button
                  className="my-2 h-6 w-6"
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setTheme("light")}
                >
                  <SunIcon size={14} />
                </Button>{" "}
                <span className="my-2 mx-2"> / </span>
                <Button
                  className="my-2 h-6 w-6"
                  variant={"outline"}
                  size={"icon"}
                  onClick={() => setTheme("dark")}
                >
                  <MoonIcon size={14} />
                </Button>
              </div>
            </li>
            <Separator />
            <li className="space-y-4">
              <strong>Share your thoughts 💬 </strong>
              <SocialMediaLinks />
              <br />
              <br />
              <br />
            </li>
          </ul>
        )}
      </div>
    );
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
