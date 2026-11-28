# Ecosystem status badge

The web app and a React Native client share `frontend/assets/status-badge.riv`. The source scene is in `scene.rml`. Its artboard is **Status Badge**, and its **State Machine 1** uses the numeric `stateIndex` input. The asset is self-contained and uses no scripts or external art.

The shared TypeScript contract is in `types/ecosystem-status.ts`. In `@rive-app/react-native`, load the same file with `useRiveFile`, render `RiveView` with `artboardName={badgeAsset.artboard}` and `stateMachineName={badgeAsset.stateMachineName}`, then call `viewRef.setNumberInputValue(badgeAsset.input, badgeStateIndex[status])` when the view is ready or the status changes. Keep the label in a native `Text` element. [React Native runtime reference](https://rive.app/docs/runtimes/react-native/rive-ref-methods)

Run `npm run test:badge` from `ecosystem` to check the asset and all three state transitions with the Rive runtime.
