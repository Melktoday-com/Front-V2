import TemporaryRentScene from "@/scenes/temporary-rent";
import { Suspense } from "react";

export default function TemporaryRentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TemporaryRentScene />
        </Suspense>
    );
}
