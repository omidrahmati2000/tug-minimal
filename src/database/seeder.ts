import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { InitialSeeder } from './seeders/initial.seeder';

async function runSeeders() {
  const dataSource = new DataSource(databaseConfig as any);
  
  try {
    await dataSource.initialize();
    console.log('📊 Database connected for seeding');

    const initialSeeder = new InitialSeeder(dataSource);
    await initialSeeder.run();

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

runSeeders();