import AdsScene from "@/scenes/ads";
import { Suspense } from "react";

export default function Explore() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdsScene />
    </Suspense>
  );
}

