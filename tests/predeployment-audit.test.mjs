import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function load(path, imports, globals = {}) {
  const target = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: target, exports: target.exports, require: (name) => {
    if (name === "react/jsx-runtime") return jsx;
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  }, Response, File, TextDecoder, Uint8Array, URL, ...globals });
  return target.exports;
}

const nextResponse = {
  json: (body, options) => ({ body, status: options.status }),
  redirect: (url, status = 307) => ({ url: String(url), status }),
};

test("OAuth callback only reports success when code exchange succeeds", async () => {
  let exchanges = 0;
  const route = (error) => load("app/auth/callback/route.ts", {
    "next/server": { NextResponse: nextResponse },
    "../../../lib/server": { createClient: async () => ({ auth: {
      exchangeCodeForSession: async () => { exchanges++; return { error }; },
    } }) },
  });
  assert.equal((await route(null).GET({ url: "https://example.com/auth/callback" })).status, 400);
  assert.equal(exchanges, 0);
  assert.equal((await route({ message: "invalid code" }).GET({ url: "https://example.com/auth/callback?code=bad" })).status, 400);
  const success = await route(null).GET({ url: "https://example.com/auth/callback?code=valid" });
  assert.equal(success.url, "https://example.com/");
  assert.equal(success.status, 307);
});

test("login displays provider/network errors and guards repeated clicks", async () => {
  for (const failsByThrowing of [false, true]) {
    let calls = 0;
    const states = [];
    let index = 0;
    let finish;
    const gate = new Promise((resolve) => { finish = resolve; });
    const submitting = { current: false };
    const { default: Login } = load("app/login/page.tsx", {
      "../components/bakery-mark": { default: () => null },
      "react": { useRef: () => submitting, useState: (initial) => {
        const current = index++; states[current] = initial;
        return [initial, (value) => { states[current] = value; }];
      } },
      "../../lib/client": { createClient: () => ({ auth: { signInWithOAuth: async () => {
        calls++;
        await gate;
        if (failsByThrowing) throw new Error("Network failure");
        return { error: { message: "Provider error" } };
      } } }) },
    }, { window: { location: { origin: "https://example.com" } } });
    const form = Login().props.children.props.children[1];
    const button = form.props.children.find((child) => child?.type === "button");
    const first = button.props.onClick();
    await button.props.onClick();
    assert.equal(calls, 1);
    finish();
    await first;
    assert.match(states[0], /Couldn’t start sign-in/);
    assert.equal(states[1], false);
  }
});

test("session proxy forwards refreshed cookies to both the request and response", async () => {
  const requestCookies = new Map([["session", "expired"]]);
  const request = { cookies: {
    getAll: () => [...requestCookies].map(([name, value]) => ({ name, value })),
    set: (name, value) => requestCookies.set(name, value),
  } };
  const { proxy } = load("proxy.ts", {
    "@supabase/ssr": { createServerClient: (_url, _key, options) => ({ auth: {
      getUser: async () => {
        assert.equal(options.cookies.getAll()[0].value, "expired");
        options.cookies.setAll([{ name: "session", value: "fresh", options: { httpOnly: true } }], { "Cache-Control": "private, no-store" });
      },
    } }) },
    "next/server": { NextResponse: { next: ({ request: forwarded }) => {
      const cookies = new Map();
      return { request: forwarded, savedCookies: cookies, headers: new Headers(), cookies: {
        set: (name, value, options) => cookies.set(name, { value, options }),
      } };
    } } },
  }, { process: { env: {} }, Headers });
  const response = await proxy(request);
  assert.equal(requestCookies.get("session"), "fresh");
  assert.equal(response.savedCookies.get("session").value, "fresh");
  assert.equal(response.savedCookies.get("session").options.httpOnly, true);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

function profileHarness(user = { id: "user-id" }) {
  const calls = { uploads: [], updates: [], filters: [] };
  const query = { eq: async (...args) => { calls.filters.push(args); return { error: null }; } };
  const { POST } = load("app/profile/update/route.ts", {
    "next/server": { NextResponse: nextResponse },
    "../../../lib/server": { createClient: async () => ({
      auth: { getUser: async () => ({ data: { user } }) },
      from: () => ({ update: (value) => { calls.updates.push(value); return query; } }),
      storage: { from: () => ({
        upload: async (path, file) => { calls.uploads.push({ path, file }); return { error: null }; },
        getPublicUrl: (path) => ({ data: { publicUrl: `https://example.com/${path}` } }),
      }) },
    }) },
  });
  return { calls, post: (avatar, firstName = "Chef") => POST({ url: "https://example.com/profile/update",
    formData: async () => new Map([["first_name", firstName], ["last_name", "Baker"], ["avatar", avatar]]) }) };
}

test("profile requires authentication and validates form fields and image uploads", async () => {
  const anonymous = profileHarness(null);
  assert.equal((await anonymous.post(null)).url, "https://example.com/login");
  assert.equal(anonymous.calls.updates.length, 0);
  for (const avatar of [
    new File(["<svg />"], "avatar.svg", { type: "image/svg+xml" }),
    new File(["not a png"], "avatar.png", { type: "image/png" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
    "not a file",
  ]) {
    const invalid = profileHarness();
    assert.equal((await invalid.post(avatar)).status, 400);
    assert.equal(invalid.calls.uploads.length, 0);
    assert.equal(invalid.calls.updates.length, 0);
  }
  const invalidName = profileHarness();
  assert.equal((await invalidName.post(null, new File(["bad"], "name.txt"))).status, 400);
  const valid = profileHarness();
  const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], "misleading.html", { type: "image/png" });
  assert.equal((await valid.post(png)).status, 303);
  assert.match(valid.calls.uploads[0].path, /^user-id\/\d+\.png$/);
  assert.equal(valid.calls.updates[0].first_name, "Chef");
  assert.deepEqual(valid.calls.filters[0], ["id", "user-id"]);
});

function voteHarness({ existingVote = null, mutationError = null } = {}) {
  const calls = { inserts: [], updates: [], deletes: 0, refreshes: 0, notifications: [] };
  const states = [];
  let cursor = 0;
  const submitting = { current: false };
  const query = {
    select() { return this; }, eq() { return this; },
    maybeSingle: async () => ({ data: existingVote, error: null }),
    then: (resolve) => Promise.resolve({ error: mutationError }).then(resolve),
    insert: (row) => { calls.inserts.push(row); return query; },
    update: (row) => { calls.updates.push(row); return query; },
    delete: () => { calls.deletes++; return query; },
  };
  const { default: Votes } = load("app/components/generation-votes.tsx", {
    "react": { useEffect() {}, useRef: () => submitting, useState: (initial) => {
      const index = cursor++; states[index] = initial;
      return [initial, (value) => { states[index] = value; }];
    } },
    "next/link": { default: () => null },
    "next/navigation": { useRouter: () => ({ refresh: () => { calls.refreshes++; } }) },
    "../../lib/client": { createClient: () => ({
      auth: { getUser: async () => ({ data: { user: { id: "user-id" } }, error: null }) },
      from: () => query,
    }) },
  });
  const tree = Votes({ itemId: 12, source: "generation", userId: "user-id", upvotes: 0, downvotes: 0,
    currentVote: existingVote?.vote ?? null, onVoteChange: (vote) => calls.notifications.push(vote) });
  const buttons = tree.props.children[0].props.children;
  return { calls, states, like: buttons[0].props.onClick, boo: buttons[1].props.onClick };
}

test("voting ignores repeated clicks during saving and inserts one vote", async () => {
  const { calls, like } = voteHarness();
  await Promise.all([like(), like()]);
  assert.equal(calls.inserts.length, 1);
  assert.equal(calls.inserts[0].generation_id, 12);
  assert.equal(calls.inserts[0].joke_id, null);
  assert.deepEqual(calls.notifications, [1]);
});

test("existing votes are updated or removed and uniqueness conflicts do not advance", async () => {
  const update = voteHarness({ existingVote: { vote: 1 } });
  await update.boo();
  assert.equal(update.calls.inserts.length, 0);
  assert.equal(update.calls.updates[0].vote, -1);
  const remove = voteHarness({ existingVote: { vote: 1 } });
  await remove.like();
  assert.equal(remove.calls.deletes, 1);
  assert.deepEqual(remove.calls.notifications, [null]);
  const conflict = voteHarness({ mutationError: { code: "23505" } });
  await conflict.like();
  assert.equal(conflict.calls.notifications.length, 0);
  assert.equal(conflict.calls.refreshes, 1);
  assert.match(conflict.states[3], /another tab/);
});

test("navigation destinations resolve to separate page routes", () => {
  for (const route of ["", "generate", "secret", "profile", "login"]) {
    assert.ok(fs.existsSync(`app/${route ? `${route}/` : ""}page.tsx`));
  }
  assert.ok(!fs.readFileSync("app/page.tsx", "utf8").includes("<Generations"));
  assert.ok(fs.readFileSync("app/generate/page.tsx", "utf8").includes("<Generations"));
});
