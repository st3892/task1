import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function mountGame(reducedMotion = false, storage = new Map(), storageUnavailable = false, itemRoll = () => 0.5) {
  const state = [];
  const refs = [];
  const effects = [];
  const pendingEffects = [];
  let effectIndex = 0;
  const frames = new Map();
  const timers = new Map();
  let now = 0;
  let timerId = 0;
  const listeners = new Set();
  let stateIndex = 0;
  let refIndex = 0;
  let rendered = false;
  let frameId = 0;
  const unsubscribers = [];
  const media = { matches: reducedMotion,
    addEventListener: (_event, callback) => listeners.add(callback),
    removeEventListener: (_event, callback) => listeners.delete(callback) };
  const documentState = { hidden: false, addEventListener: (_event, callback) => listeners.add(callback),
    removeEventListener: (_event, callback) => listeners.delete(callback) };
  const react = {
    useId: () => "game-instructions",
    useRef: (initial) => {
      const index = refIndex++;
      if (!refs[index]) refs[index] = { current: initial };
      return refs[index];
    },
    useState: (initial) => {
      const index = stateIndex++;
      if (!rendered) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useEffect: (effect, dependencies) => {
      const index = effectIndex++;
      const previous = effects[index];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        pendingEffects.push(() => {
          previous?.cleanup?.();
          effects[index] = { dependencies, cleanup: effect() };
        });
      }
    },
    useSyncExternalStore: (subscribe, snapshot) => {
      if (!rendered) unsubscribers.push(subscribe(() => {}));
      return snapshot();
    },
  };
  const target = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync("app/components/catch-the-sprinkles.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const stableMath = Object.create(Math);
  let randomIndex = 0;
  let itemIndex = 0;
  stableMath.random = () => randomIndex++ % 5 === 0 ? itemRoll(itemIndex++) : 0.5;
  vm.runInNewContext(code, { module: target, exports: target.exports,
    require: (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return jsx;
      throw new Error(`Unexpected import: ${name}`);
    },
    Math: stableMath,
    performance: { now: () => now },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, due: now + delay }); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    Event: class { constructor(type) { this.type = type; } },
    window: { matchMedia: () => media,
      localStorage: {
        getItem: (key) => { if (storageUnavailable) throw new Error("Storage disabled"); return storage.get(key) ?? null; },
        setItem: (key, value) => { if (storageUnavailable) throw new Error("Storage disabled"); storage.set(key, value); },
      },
      addEventListener: (_event, callback) => listeners.add(callback),
      removeEventListener: (_event, callback) => listeners.delete(callback),
      dispatchEvent() {},
    },
    document: documentState,
    requestAnimationFrame: (callback) => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  function render() {
    stateIndex = 0;
    refIndex = 0;
    effectIndex = 0;
    const tree = target.exports.default();
    rendered = true;
    for (const run of pendingEffects.splice(0)) run();
    return tree;
  }
  render();
  return { state, frames, timers, listeners, render, media, documentState,
    tick: (time) => {
      now = time;
      for (const [timer, entry] of [...timers]) {
        if (entry.due <= now) { timers.delete(timer); entry.callback(); }
      }
      if (!frames.size) return;
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(time);
    },
    unmount: () => { for (const effect of effects) effect.cleanup?.(); for (const unsubscribe of unsubscribers) unsubscribe(); },
  };
}

function findElement(tree, predicate) {
  if (!tree || typeof tree !== "object") return undefined;
  if (predicate(tree)) return tree;
  const children = tree.props?.children;
  for (const child of [children].flat(Infinity)) {
    const match = findElement(child, predicate);
    if (match) return match;
  }
}

function start(game) {
  const button = findElement(game.render(), (element) => element.type === "button");
  button.props.onClick();
  game.render();
}

function play(game, until, from = 0) {
  for (let time = from; time < until; time += 33) game.tick(time);
}

test("rounds stay idle until New batch and end at 30 seconds with no live timers", () => {
  const game = mountGame();
  assert.equal(game.frames.size, 0);
  assert.equal(game.timers.size, 0);
  start(game);
  assert.equal(game.state[6], 30);
  play(game, 3500);
  assert.ok(game.state[2] > 0);
  assert.equal(game.state[6], 27);
  game.tick(30000);
  const finalScore = game.state[2];
  assert.equal(game.state[6], 0);
  assert.equal(game.state[7], true);
  assert.equal(game.frames.size, 0);
  assert.equal(game.timers.size, 0);
  game.tick(31000);
  assert.equal(game.state[2], finalScore);
  const button = findElement(game.render(), (element) => element.type === "button");
  assert.equal(button.props.children, "Bake another batch");
  game.unmount();
});

test("arrow keys and pointer input move the bowl without trapping Tab", () => {
  const game = mountGame();
  start(game);
  const tray = findElement(game.render(), (element) => element.props?.className === "sprinkle-tray");
  let prevented = 0;
  tray.props.onKeyDown({ key: "ArrowLeft", preventDefault: () => { prevented++; } });
  assert.equal(game.state[0], 44);
  tray.props.onKeyDown({ key: "ArrowRight", preventDefault: () => { prevented++; } });
  assert.equal(game.state[0], 50);
  tray.props.onKeyDown({ key: "Tab", preventDefault: () => { prevented++; } });
  assert.equal(prevented, 2);
  const currentTarget = { getBoundingClientRect: () => ({ left: 100, width: 200 }), focus() {}, setPointerCapture() {} };
  tray.props.onPointerMove({ currentTarget, clientX: 260, pointerType: "mouse", buttons: 0 });
  assert.equal(game.state[0], 80);
  tray.props.onPointerDown({ currentTarget, clientX: 0, pointerId: 1 });
  assert.equal(game.state[0], 11);
  game.unmount();
});

test("unmount cancels animation, deadline timer, and listeners", () => {
  const game = mountGame();
  start(game);
  assert.equal(game.frames.size, 1);
  assert.equal(game.timers.size, 1);
  assert.equal(game.listeners.size, 3);
  const callback = game.frames.values().next().value;
  game.unmount();
  assert.equal(game.frames.size, 0);
  assert.equal(game.timers.size, 0);
  assert.equal(game.listeners.size, 0);
  callback(5000);
  assert.equal(game.frames.size, 0);
});

test("reduced motion shows a static state without a game, score, or timers", () => {
  const game = mountGame(true);
  const tree = game.render();
  assert.equal(game.frames.size, 0);
  assert.equal(game.timers.size, 0);
  assert.ok(findElement(tree, (element) => element.props?.className === "sprinkle-static"));
  assert.equal(findElement(tree, (element) => element.props?.className === "sprinkle-tray"), undefined);
  assert.equal(findElement(tree, (element) => element.props?.className === "sprinkle-score"), undefined);
  game.unmount();
  assert.equal(game.listeners.size, 0);
});

test("completed-round best persists and New batch resets only the current score", () => {
  const storage = new Map();
  const game = mountGame(false, storage);
  start(game);
  play(game, 3500);
  game.tick(30000);
  const best = game.state[2];
  assert.ok(best > 0);
  assert.equal(storage.get("whisk-takers-sprinkles-best"), String(best));
  assert.equal(game.state[8], true);
  start(game);
  assert.equal(game.state[2], 0);
  assert.equal(game.state[3], best);
  assert.equal(game.state[6], 30);
  assert.equal(game.frames.size, 1);
  assert.equal(game.timers.size, 1);
  game.unmount();
  const nextGame = mountGame(false, storage);
  const scoreBoard = findElement(nextGame.render(), (element) => element.props?.className === "sprinkle-scoreboard");
  assert.equal(scoreBoard.props.children[1].props.children[1].props.children, best);
  nextGame.unmount();
});

test("normal catches give one point and golden catches give three", () => {
  const normal = mountGame();
  const golden = mountGame(false, new Map(), false, () => 0.2);
  start(normal);
  start(golden);
  play(normal, 3500);
  play(golden, 3500);
  assert.ok(normal.state[2] > 0);
  assert.equal(golden.state[2], normal.state[2] * 3);
  normal.unmount();
  golden.unmount();
});

test("onion catches deduct three, clamp at zero, and show temporary wobble feedback", () => {
  const game = mountGame(false, new Map(), false, (index) => index < 3 ? 0.5 : 0.05);
  start(game);
  play(game, 3500);
  assert.equal(game.state[2], 3);
  play(game, 4200, 3500);
  assert.equal(game.state[2], 0);
  assert.notEqual(game.state[9], null);
  assert.ok(findElement(game.render(), (element) => element.props?.className === "sprinkle-ew"));
  assert.ok(findElement(game.render(), (element) => element.props?.className === "sprinkle-bowl sprinkle-bowl-ew"));
  play(game, 5000, 4200);
  assert.equal(game.state[2], 0);
  game.unmount();
});

test("unavailable storage does not break play or the in-memory completed-round best", () => {
  const game = mountGame(false, new Map(), true);
  start(game);
  play(game, 3500);
  game.tick(30000);
  assert.ok(game.state[2] > 0);
  assert.equal(game.state[3], game.state[2]);
  game.unmount();
});

test("hidden tabs stop animation but the round deadline still ends on time", () => {
  const game = mountGame();
  start(game);
  play(game, 3500);
  const score = game.state[2];
  game.documentState.hidden = true;
  game.render();
  assert.equal(game.frames.size, 0);
  assert.equal(game.timers.size, 1);
  game.tick(30000);
  game.documentState.hidden = false;
  game.render();
  assert.equal(game.frames.size, 0);
  assert.equal(game.state[2], score);
  assert.equal(game.state[7], true);
  game.unmount();
});

test("enabling reduced motion during a round cancels frames and cleanup removes the timer", () => {
  const game = mountGame();
  start(game);
  game.media.matches = true;
  game.render();
  assert.equal(game.frames.size, 0);
  game.unmount();
  assert.equal(game.timers.size, 0);
  assert.equal(game.listeners.size, 0);
});

test("simplified UI removes Pause and both unwanted text blocks", () => {
  const game = mountGame();
  const rendered = JSON.stringify(game.render());
  assert.ok(rendered.includes("This batch:"));
  assert.ok(rendered.includes("Time:"));
  assert.ok(!rendered.includes("Pause") && !rendered.includes("Resume"));
  assert.ok(!rendered.includes("Move your mouse or drag to catch."));
  assert.ok(!rendered.includes("Your personal best stays in this browser."));
  game.unmount();
});
