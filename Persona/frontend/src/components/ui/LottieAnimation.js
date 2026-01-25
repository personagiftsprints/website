// components/ui/LottieAnimation.js
"use client";

import Lottie from "lottie-react";

export default function LottieAnimation({ animationData, loop = false, onComplete }) {
  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={true}
      onComplete={onComplete}
      style={{ width: "100%", height: "100%" }}
    />
  );
}