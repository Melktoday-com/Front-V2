"use client";

import { useEffect, useState } from "react";
import { isMapDebugActive } from "@/lib/map-debugger";

export function MapDebugOverlay({ map }: { map?: any }) {
  const [active, setActive] = useState(false);
  const [stats, setStats] = useState<{
    displayMode: string;
    swControlled: boolean;
    containerSize: string;
    leafletSize: string;
    tilesLoaded: number;
    tileErrors: number;
    onLine: boolean;
  }>({
    displayMode: "unknown",
    swControlled: false,
    containerSize: "0x0",
    leafletSize: "0x0",
    tilesLoaded: 0,
    tileErrors: 0,
    onLine: true,
  });

  useEffect(() => {
    if (!isMapDebugActive()) return;
    setActive(true);

    const updateStats = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone;

      let cSize = "N/A";
      let lSize = "N/A";

      if (map) {
        try {
          const container = map.getContainer();
          if (container) {
            cSize = `${container.clientWidth}x${container.clientHeight}`;
          }
          const s = map.getSize();
          lSize = `${s.x}x${s.y}`;
        } catch {}
      }

      const logs = window.__mapDebugLogs || [];
      const loaded = logs.filter((l) => l.type === "tile" && l.message === "tileload").length;
      const errors = logs.filter((l) => l.type === "error" && l.message === "tileerror").length;

      setStats({
        displayMode: isStandalone ? "standalone" : "browser",
        swControlled: Boolean(navigator.serviceWorker?.controller),
        containerSize: cSize,
        leafletSize: lSize,
        tilesLoaded: loaded,
        tileErrors: errors,
        onLine: navigator.onLine,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [map]);

  if (!active) return null;

  const copyLogs = () => {
    const logs = JSON.stringify(window.__mapDebugLogs || [], null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logs);
      alert("Logs copied to clipboard!");
    } else {
      console.log("[MapDebug Logs]", logs);
      alert("Logs dumped to console (clipboard not permitted)");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.85)",
        color: "#00ff66",
        fontFamily: "monospace",
        fontSize: "11px",
        padding: "8px 12px",
        borderRadius: "8px",
        border: "1px solid #00ff66",
        maxWidth: "280px",
        pointerEvents: "auto",
        lineHeight: 1.4,
      }}
      dir="ltr"
    >
      <div style={{ fontWeight: "bold", borderBottom: "1px solid #005522", marginBottom: 4 }}>
        MAP PWA DIAGNOSTICS
      </div>
      <div>Mode: {stats.displayMode}</div>
      <div>Online: {stats.onLine ? "YES" : "NO"}</div>
      <div>SW Controller: {stats.swControlled ? "ACTIVE" : "NONE"}</div>
      <div>Container: {stats.containerSize}</div>
      <div>Leaflet Size: {stats.leafletSize}</div>
      <div>Tiles: {stats.tilesLoaded} ok / {stats.tileErrors} err</div>
      <button
        type="button"
        onClick={copyLogs}
        style={{
          marginTop: 6,
          background: "#00ff66",
          color: "#000",
          border: "none",
          padding: "2px 8px",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: "10px",
        }}
      >
        Copy Logs JSON
      </button>
    </div>
  );
}
