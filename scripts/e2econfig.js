const PRESETS = {
  localstack: {
    name: "localstack",
    localstackUrl: "http://localstack:4566",
    localstackEndpoint: "http://127.0.0.1:4566",
    e2eBaseUrl: "http://127.0.0.1:8787",
    backendDefaultPort: 4500,
    appEnv: "local",
  },
};

function resolvePreset(presetName) {
  if (presetName && PRESETS[presetName]) {
    return PRESETS[presetName];
  }
  return PRESETS.localstack;
}

function resolveConfig(options = {}) {
  const env = options.env || process.env;
  const preset = resolvePreset(options.preset);

  const localstackUrl = env.LOCALSTACK_URL || preset.localstackUrl;
  const localstackEndpoint =
    env.LOCALSTACK_ENDPOINT ||
    env.LOCALSTACK_ENDPOINT_URL ||
    env.LOCALSTACK_PUBLIC_URL ||
    env.LOCALSTACK_URL ||
    preset.localstackEndpoint;
  return {
    preset: preset.name,
    localstackUrl,
    localstackEndpoint,
    e2eBaseUrl: env.E2E_BASE_URL || preset.e2eBaseUrl,
    backendDefaultPort: Number(env.E2E_BACKEND_PORT || preset.backendDefaultPort),
    env: {
      APP_ENV: env.APP_ENV || preset.appEnv,
      AWS_REGION: env.AWS_REGION || "ap-northeast-3",
      AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID || "test",
      AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY || "test",
      DYNAMODB_TABLE_NAME: env.DYNAMODB_TABLE_NAME || "politopics-local",
      S3_ASSET_BUCKET: env.S3_ASSET_BUCKET || "politopics-articles-local",
      AWS_ENDPOINT_URL: env.AWS_ENDPOINT_URL || localstackUrl,
      DYNAMODB_ENDPOINT_URL: env.DYNAMODB_ENDPOINT_URL || localstackUrl,
      S3_ENDPOINT_URL: env.S3_ENDPOINT_URL || localstackUrl,
      S3_FORCE_PATH_STYLE: env.S3_FORCE_PATH_STYLE || "true",
      STAGE_FRONTEND_URL: env.STAGE_FRONTEND_URL,
    },
  };
}

module.exports = {
  PRESETS,
  resolveConfig,
};
