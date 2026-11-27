import { seedAdmin } from '../src/app/utils/seedAdmin';

(async () => {
  console.log('Running Admin Seed script...');
  await seedAdmin();
  process.exit(0);
})();
