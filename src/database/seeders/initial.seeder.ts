import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import { Card } from '../../cards/entities/card.entity';
import { FuelStation } from '../../fuel-stations/entities/fuel-station.entity';
import { UserRole } from '../../common/enums/user-role.enum';

export class InitialSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run(): Promise<void> {
    console.log('🌱 Running initial seeder...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if Super Admin already exists
      const existingSuperAdmin = await queryRunner.manager.findOne(User, {
        where: { email: 'admin@myfuel.com' }
      });

      let superAdmin;
      if (!existingSuperAdmin) {
        // Create Super Admin User
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        superAdmin = queryRunner.manager.create(User, {
          email: 'admin@myfuel.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: UserRole.SUPER_ADMIN,
        });

        await queryRunner.manager.save(superAdmin);
        console.log('✅ Super Admin created');
      } else {
        superAdmin = existingSuperAdmin;
        console.log('ℹ️ Super Admin already exists, skipping...');
      }

      // Create Organizations
      const organizations = [
        {
          name: 'Acme Corporation',
          code: 'ACME001',
          balance: 50000.00,
        },
        {
          name: 'Global Logistics Ltd',
          code: 'GLOBAL001',
          balance: 25000.00,
        },
        {
          name: 'Fast Transport Inc',
          code: 'FAST001',
          balance: 15000.00,
        },
      ];

      const savedOrganizations = [];
      for (const orgData of organizations) {
        const existingOrg = await queryRunner.manager.findOne(Organization, {
          where: { code: orgData.code }
        });
        
        if (!existingOrg) {
          const org = queryRunner.manager.create(Organization, orgData);
          const savedOrg = await queryRunner.manager.save(org);
          savedOrganizations.push(savedOrg);
          console.log(`✅ Organization ${orgData.name} created`);
        } else {
          savedOrganizations.push(existingOrg);
          console.log(`ℹ️ Organization ${orgData.name} already exists, skipping...`);
        }
      }

      // Create Organization Admins
      const orgAdmins = [
        {
          email: 'admin@acme.com',
          password: await bcrypt.hash('acme123', 10),
          firstName: 'John',
          lastName: 'Smith',
          role: UserRole.ORGANIZATION_ADMIN,
          organizationId: savedOrganizations[0].id,
        },
        {
          email: 'admin@global.com',
          password: await bcrypt.hash('global123', 10),
          firstName: 'Jane',
          lastName: 'Doe',
          role: UserRole.ORGANIZATION_ADMIN,
          organizationId: savedOrganizations[1].id,
        },
        {
          email: 'admin@fast.com',
          password: await bcrypt.hash('fast123', 10),
          firstName: 'Bob',
          lastName: 'Johnson',
          role: UserRole.ORGANIZATION_ADMIN,
          organizationId: savedOrganizations[2].id,
        },
      ];

      for (const adminData of orgAdmins) {
        const existingAdmin = await queryRunner.manager.findOne(User, {
          where: { email: adminData.email }
        });
        
        if (!existingAdmin) {
          const admin = queryRunner.manager.create(User, adminData);
          await queryRunner.manager.save(admin);
          console.log(`✅ Organization Admin ${adminData.email} created`);
        } else {
          console.log(`ℹ️ Organization Admin ${adminData.email} already exists, skipping...`);
        }
      }

      // Create Fleet Cards
      const cards = [
        // Acme Corporation Cards
        {
          cardNumber: '1234567890123456',
          holderName: 'John Driver',
          dailyLimit: 500.00,
          monthlyLimit: 10000.00,
          organizationId: savedOrganizations[0].id,
          lastUsageDate: new Date(),
          lastMonthReset: new Date(),
        },
        {
          cardNumber: '1234567890123457',
          holderName: 'Sarah Trucker',
          dailyLimit: 300.00,
          monthlyLimit: 8000.00,
          organizationId: savedOrganizations[0].id,
          lastUsageDate: new Date(),
          lastMonthReset: new Date(),
        },
        // Global Logistics Cards
        {
          cardNumber: '2234567890123456',
          holderName: 'Mike Transport',
          dailyLimit: 400.00,
          monthlyLimit: 12000.00,
          organizationId: savedOrganizations[1].id,
          lastUsageDate: new Date(),
          lastMonthReset: new Date(),
        },
        {
          cardNumber: '2234567890123457',
          holderName: 'Lisa Fleet',
          dailyLimit: 350.00,
          monthlyLimit: 9000.00,
          organizationId: savedOrganizations[1].id,
          lastUsageDate: new Date(),
          lastMonthReset: new Date(),
        },
        // Fast Transport Cards
        {
          cardNumber: '3234567890123456',
          holderName: 'Tom Delivery',
          dailyLimit: 250.00,
          monthlyLimit: 6000.00,
          organizationId: savedOrganizations[2].id,
          lastUsageDate: new Date(),
          lastMonthReset: new Date(),
        },
      ];

      for (const cardData of cards) {
        const existingCard = await queryRunner.manager.findOne(Card, {
          where: { cardNumber: cardData.cardNumber }
        });
        
        if (!existingCard) {
          const card = queryRunner.manager.create(Card, cardData);
          await queryRunner.manager.save(card);
          console.log(`✅ Card ${cardData.cardNumber} created for ${cardData.holderName}`);
        } else {
          console.log(`ℹ️ Card ${cardData.cardNumber} already exists, skipping...`);
        }
      }

      // Create Fuel Stations
      const fuelStations = [
        {
          name: 'Shell Station Downtown',
          location: 'Downtown, Main Street 123',
          apiKey: 'station_key_shell_001',
        },
        {
          name: 'BP Highway Station',
          location: 'Highway 101, Exit 25',
          apiKey: 'station_key_bp_002',
        },
        {
          name: 'Exxon City Center',
          location: 'City Center Plaza, Block A',
          apiKey: 'station_key_exxon_003',
        },
        {
          name: 'Chevron Airport',
          location: 'Airport District, Terminal Road',
          apiKey: 'station_key_chevron_004',
        },
      ];

      for (const stationData of fuelStations) {
        const existingStation = await queryRunner.manager.findOne(FuelStation, {
          where: { apiKey: stationData.apiKey }
        });
        
        if (!existingStation) {
          const station = queryRunner.manager.create(FuelStation, stationData);
          await queryRunner.manager.save(station);
          console.log(`✅ Fuel Station ${stationData.name} created with API key: ${stationData.apiKey}`);
        } else {
          console.log(`ℹ️ Fuel Station ${stationData.name} already exists, skipping...`);
        }
      }

      await queryRunner.commitTransaction();
      
      console.log('🎉 Initial seeder completed successfully!');
      console.log('\n📝 Test Credentials:');
      console.log('Super Admin: admin@myfuel.com / admin123');
      console.log('Acme Admin: admin@acme.com / acme123');
      console.log('Global Admin: admin@global.com / global123');
      console.log('Fast Admin: admin@fast.com / fast123');
      console.log('\n🔑 Fuel Station API Keys:');
      console.log('station_key_shell_001');
      console.log('station_key_bp_002');
      console.log('station_key_exxon_003');
      console.log('station_key_chevron_004');

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Seeder failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}