function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvList(names) {
  names.forEach((name) => requireEnv(name));
}

module.exports = {
  requireEnv,
  requireEnvList,
};
