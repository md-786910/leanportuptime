const fs = require('fs/promises');
const path = require('path');

// Shared with the mongo-backup sidecar (see docker-compose.yml).
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const TRIGGER = path.join(BACKUP_DIR, '.backup-now');
const STATUS = path.join(BACKUP_DIR, '.status.json');
// If a request sits untouched this long, the sidecar is probably not running.
const STALE_MS = 2 * 60 * 1000;

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

async function getState() {
  let entries = [];
  try {
    entries = await fs.readdir(BACKUP_DIR);
  } catch {
    // Directory not mounted/created yet — treated as "no backups".
  }

  const backups = (
    await Promise.all(
      entries
        .filter((n) => /^mongo-.*\.archive\.gz$/.test(n))
        .map(async (name) => {
          const st = await fs.stat(path.join(BACKUP_DIR, name)).catch(() => null);
          return st && { name, size: st.size, createdAt: st.mtime.toISOString() };
        })
    )
  )
    .filter(Boolean)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const request = await readJson(TRIGGER);
  const status = await readJson(STATUS);
  const requestedAt = request?.requestedAt || null;

  return {
    backups,
    pending: Boolean(request),
    requestedAt,
    stale: Boolean(requestedAt && Date.now() - new Date(requestedAt).getTime() > STALE_MS),
    running: status?.state === 'running',
    lastRun: status && status.state !== 'running' ? status : null,
  };
}

exports.list = async (req, res, next) => {
  try {
    res.json({ success: true, data: await getState() });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const state = await getState();
    if ((state.pending && !state.stale) || state.running) {
      return res.status(409).json({
        success: false,
        error: { code: 'BACKUP_IN_PROGRESS', message: 'A backup is already in progress' },
      });
    }

    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.writeFile(
      TRIGGER,
      JSON.stringify({ requestedAt: new Date().toISOString(), requestedBy: String(req.user._id || req.user.id) })
    );

    res.status(202).json({ success: true, data: await getState() });
  } catch (error) {
    next(error);
  }
};
