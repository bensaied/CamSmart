"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
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

export default function Home() {
  return <h1> CamSmart </h1>;
}
