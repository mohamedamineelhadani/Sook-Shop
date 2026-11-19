import { config } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

async function seedAdmin() {
  await connectDB();

  const email = config.adminEmail.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = config.adminName;
    existing.password = config.adminPassword; // pre-save hook re-hashes this
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    console.log(`Admin account updated: ${email}`);
  } else {
    await User.create({
      name: config.adminName,
      email,
      password: config.adminPassword,
      role: 'admin',
    });
    console.log(`Admin account created: ${email}`);
  }

  console.log(`Password: ${config.adminPassword}`);
  await disconnectDB();
}

seedAdmin().catch(async (error) => {
  console.error('Admin seed failed:', error.message);
  await disconnectDB().catch(() => {});
  process.exitCode = 1;
});
