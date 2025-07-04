"use client";

import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { motion } from "framer-motion";

export default function RiveCardAnimation() {
  const { RiveComponent } = useRive({
    src: "https://assets.ctfassets.net/ayry21z1dzn2/TPU3i28vPxEqq3Pz85L71/90466153079d1051adf888cb5975bf87/cordyidlenew.riv", // Place the file in `public/animations/`
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="h-[300px] w-full max-w-md"
    >
      <RiveComponent />
    </motion.div>
  );
}
