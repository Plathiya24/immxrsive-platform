import { EventType, RiveFile, RuntimeLoader, useRive } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";
import { badgeAsset } from "../types/ecosystem-status";

let badgeFile: Promise<RiveFile> | undefined;

function loadBadgeFile() {
  badgeFile ??= (async () => {
    RuntimeLoader.setWasmUrl("/_ecosystem/rive-runtime.wasm");
    RuntimeLoader.setWasmFallbackUrl("/_ecosystem/rive-runtime-fallback.wasm");
    return new Promise<RiveFile>((resolve, reject) => {
      const file = new RiveFile({
        src: badgeAsset.path,
        enableRiveAssetCDN: false,
        onLoad: () => {
          // Keep a reference for the page when every off-screen canvas has been cleaned up.
          file.getInstance();
          resolve(file);
        },
        onLoadError: () => reject(new Error("Unable to load the status badge")),
      });
      void file.init().catch(reject);
    });
  })();
  return badgeFile;
}

export default function RiveStatusIndicator({ stateIndex }: { stateIndex: number }) {
  const [file, setFile] = useState<RiveFile | null>(null);

  useEffect(() => {
    let active = true;
    void loadBadgeFile().then(result => { if (active) setFile(result); }, () => {});
    return () => { active = false; };
  }, []);

  return file && <StatusCanvas file={file} stateIndex={stateIndex} />;
}

function StatusCanvas({ file, stateIndex }: { file: RiveFile; stateIndex: number }) {
  const [paintedState, setPaintedState] = useState<number | null>(null);
  const { rive, setCanvasRef } = useRive(
    {
      riveFile: file,
      artboard: badgeAsset.artboard,
      stateMachine: badgeAsset.stateMachineName,
      autoplay: false,
      shouldDisableRiveListeners: true,
    },
    { shouldResizeCanvasToContainer: false, shouldUseIntersectionObserver: false },
  );

  useEffect(() => {
    if (!rive) return;
    const input = rive.stateMachineInputs(badgeAsset.stateMachineName)?.find(item => item.name === badgeAsset.input);
    if (!input) return;
    const onAdvance = () => {
      rive.off(EventType.Advance, onAdvance);
      setPaintedState(stateIndex);
    };
    rive.on(EventType.Advance, onAdvance);
    input.value = stateIndex;
    rive.play(badgeAsset.stateMachineName);
    return () => rive.off(EventType.Advance, onAdvance);
  }, [rive, stateIndex]);

  return (
    <canvas
      className="ecosystem-status-canvas"
      data-painted={paintedState === stateIndex}
      ref={setCanvasRef}
      width={32}
      height={32}
      aria-hidden="true"
    />
  );
}
