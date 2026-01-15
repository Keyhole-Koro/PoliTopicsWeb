#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const DEFAULT_CONFIG_NAME = "targets.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage() {
  return [
    "Usage:",
    "  node profile/measure-backend-latency.simple.js --config <path> [--duration-ms <ms>]",
    "",
    "Example:",
    "  node profile/measure-backend-latency.simple.js --config profile/targets.json",
  ].join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--config":
        args.config = argv[i + 1];
        i += 1;
        break;
      case "--duration-ms":
        args.durationMs = Number(argv[i + 1]);
        i += 1;
        break;
      case "--help":
      case "-h":
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) throw new Error(`Config file not found: ${configPath}`);
  const raw = fs.readFileSync(configPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON config: ${configPath}\n${e.message}`);
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) throw new Error("Missing baseUrl in config");
  let normalized = String(baseUrl);
  if (!/^https?:\/\//.test(normalized)) normalized = `https://${normalized}`;
  if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
  return normalized;
}

function resolvePath(pathTemplate, pathParams = {}) {
  let out = String(pathTemplate || "/");
  if (!out.startsWith("/")) out = `/${out}`;

  const missing = [];
  const replace = (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(pathParams, key)) {
      missing.push(key);
      return match;
    }
    return encodeURIComponent(String(pathParams[key]));
  };

  out = out.replace(/:([A-Za-z0-9_]+)/g, replace);
  out = out.replace(/\{([A-Za-z0-9_]+)\}/g, replace);

  if (missing.length) throw new Error(`Missing pathParams: ${missing.join(", ")}`);
  return out;
}

function applyQuery(url, query) {
  if (!query || typeof query !== "object") return;
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, String(item));
    } else {
      url.searchParams.set(k, String(v));
    }
  }
}

function hasHeader(headers, name) {
  const needle = name.toLowerCase();
  return Object.keys(headers).some((k) => k.toLowerCase() === needle);
}

function buildRequestOptions(target) {
  const headers = { ...(target.headers || {}) };
  let body = target.body;

  if (body !== undefined && body !== null && typeof body === "object") {
    body = JSON.stringify(body);
    if (!hasHeader(headers, "content-type")) headers["Content-Type"] = "application/json";
  }
  return { headers, body };
}

function normalizeTarget(raw, defaults, baseUrl) {
  if (!raw || typeof raw !== "object") throw new Error("Target entry must be an object");
  if (!raw.path) throw new Error("Target entry is missing path");

  const name = raw.name || raw.path;
  const method = String(raw.method ?? defaults.method ?? "GET").toUpperCase();
  const intervalMs = Number(raw.intervalMs ?? defaults.intervalMs ?? 5000);
  const timeoutMs = Number(raw.timeoutMs ?? defaults.timeoutMs ?? 15000);
  const samples = raw.samples ?? defaults.samples ?? 10; // null => unlimited
  const readBody = raw.readBody ?? defaults.readBody ?? true;
  const headers = { ...(defaults.headers || {}), ...(raw.headers || {}) };
  const pathValue = resolvePath(raw.path, raw.pathParams || {});
  const url = new URL(`${baseUrl}${pathValue}`);
  applyQuery(url, raw.query);

  if (!Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error(`Invalid intervalMs for ${name}: ${intervalMs}`);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error(`Invalid timeoutMs for ${name}: ${timeoutMs}`);

  const target = {
    name,
    method,
    url: url.toString(),
    intervalMs,
    timeoutMs,
    samples,
    readBody,
    headers,
    body: raw.body,
  };

  return { ...target, requestOptions: buildRequestOptions(target) };
}

async function sendRequest(target) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), target.timeoutMs);
  const startedAt = performance.now();

  let status = null;
  let ok = false;
  let error = null;

  try {
    const res = await fetch(target.url, {
      method: target.method,
      headers: target.requestOptions.headers,
      body: target.requestOptions.body,
      signal: controller.signal,
    });
    status = res.status;
    ok = res.ok;
    if (target.readBody) await res.arrayBuffer();
  } catch (err) {
    error = { name: err?.name || "Error", message: err?.message || String(err) };
  } finally {
    clearTimeout(timeout);
  }

  const durationMs = performance.now() - startedAt;

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    target: target.name,
    method: target.method,
    url: target.url,
    status,
    ok,
    durationMs: Number(durationMs.toFixed(2)),
    error,
  }));

  return { durationMs, error };
}

function summarize(samples) {
  if (!samples.length) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avg = sum / sorted.length;

  const percentile = (p) => {
    const idx = Math.ceil(p * sorted.length) - 1;
    return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)];
  };

  return {
    count: sorted.length,
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg: Number(avg.toFixed(2)),
    p50: Number(percentile(0.5).toFixed(2)),
    p95: Number(percentile(0.95).toFixed(2)),
    p99: Number(percentile(0.99).toFixed(2)),
  };
}

async function main() {
  if (typeof fetch !== "function") throw new Error("Global fetch is not available. Use Node.js 18+");

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const configPath = path.resolve(
    args.config || process.env.MEASURE_CONFIG || path.join(__dirname, DEFAULT_CONFIG_NAME),
  );
  const config = loadConfig(configPath);

  const baseUrl = normalizeBaseUrl(config.baseUrl);
  const defaults = config.defaults || {};
  const durationMs = Number(args.durationMs ?? config.durationMs ?? 0);
  const endTime = Number.isFinite(durationMs) && durationMs > 0 ? Date.now() + durationMs : null;

  const rawTargets = Array.isArray(config.targets) ? config.targets : [];
  if (!rawTargets.length) throw new Error("Config has no targets.");

  const targets = rawTargets.map((t) => normalizeTarget(t, defaults, baseUrl));

  const healthzTarget = targets.find((t) => t.name === "healthz" || t.url.endsWith("/healthz"));
  const otherTargets = targets.filter((t) => t !== healthzTarget);

  if (healthzTarget) {
    await sendRequest(healthzTarget, "dummy"); // 集計しない前提のログtype
  }

  await sleep(10_000);

  const measurementTargets = otherTargets.length ? otherTargets : targets; // 念のため

  // Scheduler state
  const state = new Map(); // name -> { nextAt, remaining, durations[], errors }
  for (const t of measurementTargets) {
    state.set(t.name, {
      nextAt: Date.now(), // start immediately
      remaining: t.samples === null ? null : Number(t.samples),
      durations: [],
      errors: 0,
    });
  }

  let stop = false;
  process.on("SIGINT", () => { stop = true; });

  while (!stop && (!endTime || Date.now() < endTime)) {
    // pick targets due now, in fixed order
    let didWork = false;

    for (const t of measurementTargets) {
      const s = state.get(t.name);
      if (!s) continue;

      if (s.remaining !== null && s.remaining <= 0) continue;
      if (Date.now() < s.nextAt) continue;

      didWork = true;

      const { durationMs: d, error } = await sendRequest(t);
      if (error) s.errors += 1;
      else s.durations.push(d);

      if (s.remaining !== null) s.remaining -= 1;
      s.nextAt = Date.now() + t.intervalMs;

      if (stop || (endTime && Date.now() >= endTime)) break;
    }

    // If nothing was due, sleep a bit to avoid busy loop
    if (!didWork) await sleep(20);

    // Optional early exit: all targets done (samples reached)
    const allDone = measurementTargets.every((t) => {
      const s = state.get(t.name);
      return s && s.remaining !== null && s.remaining <= 0;
    });
    if (allDone) break;
  }

  console.log("== Summary ==");
  for (const t of measurementTargets) {
    const s = state.get(t.name);
    console.log(JSON.stringify({
      target: t.name,
      stats: summarize(s?.durations || []),
      errors: s?.errors || 0,
    }));
  }
}

main().catch((err) => {
  console.error(err.message || err);
  console.log(usage());
  process.exit(1);
});
