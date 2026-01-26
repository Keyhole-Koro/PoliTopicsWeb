#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const DEFAULT_CONFIG_NAME = "targets.json";
const DEFAULT_COOLDOWN_MS = 6 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usage() {
  return [
    "Usage:",
    "  node profile/measure-backend-coldstart.js --config <path> [--samples <n>] [--cooldown-ms <ms>]",
    "",
    "Example:",
    "  node profile/measure-backend-coldstart.js --config profile/targets.example.json --samples 3",
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
      case "--samples":
        args.samples = Number(argv[i + 1]);
        i += 1;
        break;
      case "--cooldown-ms":
        args.cooldownMs = Number(argv[i + 1]);
        i += 1;
        break;
      case "--timeout-ms":
        args.timeoutMs = Number(argv[i + 1]);
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

function resolveSamples(rawSamples, fallback) {
  const value = rawSamples ?? fallback;
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid samples: ${value}`);
  }
  return Math.trunc(parsed);
}

function normalizeTarget(raw, defaults, baseUrl, args) {
  if (!raw || typeof raw !== "object") throw new Error("Target entry must be an object");
  if (!raw.path) throw new Error("Target entry is missing path");

  const name = raw.name || raw.path;
  const method = String(raw.method ?? defaults.method ?? "GET").toUpperCase();
  const timeoutMs = Number(raw.timeoutMs ?? args.timeoutMs ?? defaults.timeoutMs ?? 15000);
  const cooldownMs = Number(raw.cooldownMs ?? args.cooldownMs ?? defaults.cooldownMs ?? DEFAULT_COOLDOWN_MS);
  const samples = resolveSamples(raw.samples, args.samples ?? defaults.samples ?? 1);
  const readBody = raw.readBody ?? defaults.readBody ?? true;
  const headers = { ...(defaults.headers || {}), ...(raw.headers || {}) };
  const pathValue = resolvePath(raw.path, raw.pathParams || {});
  const url = new URL(`${baseUrl}${pathValue}`);
  applyQuery(url, raw.query);

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error(`Invalid timeoutMs for ${name}: ${timeoutMs}`);
  if (!Number.isFinite(cooldownMs) || cooldownMs <= 0) throw new Error(`Invalid cooldownMs for ${name}: ${cooldownMs}`);
  if (samples === null) throw new Error(`samples must be set for ${name}`);

  const target = {
    name,
    method,
    url: url.toString(),
    timeoutMs,
    cooldownMs,
    samples,
    readBody,
    headers,
    body: raw.body,
  };

  return { ...target, requestOptions: buildRequestOptions(target) };
}

async function sendRequest(target, sampleIndex) {
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
    cooldownMs: target.cooldownMs,
    sample: sampleIndex,
    coldStart: true,
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

async function runTarget(target, stopFlag) {
  const durations = [];
  let errors = 0;

  for (let i = 0; i < target.samples; i += 1) {
    if (stopFlag.stop) break;
    console.log(`[coldstart] waiting ${target.cooldownMs} ms before ${target.name} (${i + 1}/${target.samples})`);
    await sleep(target.cooldownMs);
    if (stopFlag.stop) break;

    const { durationMs: d, error } = await sendRequest(target, i + 1);
    if (error) errors += 1;
    else durations.push(d);
  }

  return { name: target.name, durations, errors };
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

  const rawTargets = Array.isArray(config.targets) ? config.targets : [];
  if (!rawTargets.length) throw new Error("Config has no targets.");

  const targets = rawTargets.map((t) => normalizeTarget(t, defaults, baseUrl, args));

  const stopFlag = { stop: false };
  process.on("SIGINT", () => { stopFlag.stop = true; });

  const results = [];
  for (const target of targets) {
    if (stopFlag.stop) break;
    results.push(await runTarget(target, stopFlag));
  }

  console.log("== Summary ==");
  for (const result of results) {
    console.log(JSON.stringify({
      target: result.name,
      stats: summarize(result.durations),
      errors: result.errors,
    }));
  }
}

main().catch((err) => {
  console.error(err.message || err);
  console.log(usage());
  process.exit(1);
});
