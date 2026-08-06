// Entry point for the vendored animation bundle.
//
// The stock anime.js ESM build is 119 KB because it carries draggable, scroll
// observers, the three.js adapter, motion paths, morphing and text scrambling.
// The page uses seven things. Bundling just those and letting esbuild drop the
// rest takes it to 55 KB raw / 21 KB over the wire, which matters because this
// file competes with the photograph for bandwidth on a slow connection.
//
// Regenerate with:  npm install && npm run vendor
export {
  animate,
  createTimeline,
  stagger,
  utils,
  svg,
  createSpring,
  splitText
} from 'animejs';
