#!/usr/bin/env node
/**
 * Create (or reset the password of) an admin user — no UI registration needed.
 *
 * Usage:
 *   node scripts/createUser.js --email=admin@example.com --password=secret123 [--name="Admin"]
 *   npm run user:create -- --email=... --password=...
 */
require('dotenv').config({ override: true });
const mongoose = require('mongoose');
const config = require('../src/config');
const User = require('../src/models/User');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  })
);

async function main() {
  const { email, password, name = 'Admin' } = args;
  if (!email || !password || password.length < 8) {
    console.error('Usage: --email=<email> --password=<min 8 chars> [--name=<name>]');
    process.exit(1);
  }

  await mongoose.connect(config.mongoUri);

  let user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    user.password = password; // re-hashed by the pre-save hook
    console.log(`Updated password for ${user.email}`);
  } else {
    user = new User({ email, password, name, role: 'admin' });
    console.log(`Created admin ${email}`);
  }
  user.emailVerified = true;
  await user.save();
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
