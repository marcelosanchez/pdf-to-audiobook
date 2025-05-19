// logger utility functions
export const logLevels = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
  FATAL: 'FATAL',
};

function getTimestamp() {
  return new Date().toISOString();
}

export function logInfo(message) {
  console.log(`[${getTimestamp()}] [INFO] ${message}`);
}

export function logWarn(message) {
  console.warn(`[${getTimestamp()}] [WARN] ${message}`);
}

export function logError(message) {
  console.error(`[${getTimestamp()}] [ERROR] ${message}`);
}

export function logFatal(message) {
  console.error(`[${getTimestamp()}] [FATAL] ${message}`);
}
