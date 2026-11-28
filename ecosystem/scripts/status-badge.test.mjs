import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { test } from "node:test";
import riveCanvas from "@rive-app/react-canvas";
import { badgeAsset, badgeStateIndex } from "../types/ecosystem-status.ts";

const { RuntimeLoader } = riveCanvas;

test("the shared badge asset plays the status selected by each numeric input", async () => {
  const require = createRequire(import.meta.url);
  const requireRive = createRequire(require.resolve("@rive-app/react-canvas"));
  const wasm = await readFile(requireRive.resolve("@rive-app/canvas/rive.wasm"));
  RuntimeLoader.setWasmUrl("data:application/wasm;base64," + wasm.toString("base64"));
  RuntimeLoader.setWasmFallbackUrl(null);
  const runtime = await RuntimeLoader.awaitInstance();
  const bytes = await readFile(new URL("../../frontend" + badgeAsset.path, import.meta.url));
  const file = await runtime.load(new Uint8Array(bytes), undefined, false);
  assert.ok(file);
  const artboard = file.defaultArtboard();
  assert.equal(artboard.name, badgeAsset.artboard);
  const machine = artboard.stateMachineByName(badgeAsset.stateMachineName);
  assert.ok(machine);
  const instance = new runtime.StateMachineInstance(machine, artboard);

  try {
    const input = instance.input(0);
    assert.equal(input.name, badgeAsset.input);
    for (const [status, name] of [["live", "Live"], ["open", "Open"], ["cohort-active", "Cohort active"], ["live", "Live"]]) {
      input.asNumber().value = badgeStateIndex[status];
      const entered = [];
      for (let frame = 0; frame < 3; frame++) {
        instance.advance(1 / 60);
        for (let i = 0; i < instance.stateChangedCount(); i++) entered.push(instance.stateChangedNameByIndex(i));
      }
      assert.ok(entered.includes(name), `Expected to enter ${name}, observed ${entered.join(", ")}`);
    }
  } finally {
    instance.delete();
    artboard.delete();
    file.delete();
  }
});
