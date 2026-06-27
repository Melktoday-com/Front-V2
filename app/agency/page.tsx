import AgencyScene from "@/scenes/agency";
import { Suspense } from "react";

export default function Agency() {
  return (
    <Suspense fallback={<div>Loading...</div>}>

      <AgencyScene />
    </Suspense>

  );
}
