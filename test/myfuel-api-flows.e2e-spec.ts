import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { InitialSeeder } from '../src/database/seeders/initial.seeder';

describe('MyFuel API Complete Flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  
  // Test tokens for authentication
  let superAdminToken: string;
  let acmeAdminToken: string;
  let globalAdminToken: string;
  let fastAdminToken: string;

  // Test data from seeder
  let organizationIds: string[] = [];
  let cardIds: string[] = [];
  let userIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as the main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Get the data source and run seeder
    dataSource = moduleFixture.get<DataSource>(DataSource);
    const seeder = new InitialSeeder(dataSource);
    await seeder.run();
  });

  afterAll(async () => {
    // Clean up the test database
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      // Delete in reverse order to respect foreign key constraints
      await queryRunner.query('DELETE FROM transactions');
      await queryRunner.query('DELETE FROM cards');
      await queryRunner.query('DELETE FROM fuel_stations');
      await queryRunner.query('DELETE FROM users');
      await queryRunner.query('DELETE FROM organizations');
    } finally {
      await queryRunner.release();
    }

    await app.close();
  });

  describe('🚀 Flow 1: Super Admin Operations', () => {
    it('should login as super admin and get token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@myfuel.com',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.role).toBe('super_admin');
      
      superAdminToken = response.body.access_token;
    });

    it('should create a new organization as super admin', async () => {
      const newOrg = {
        name: 'Test Transport Ltd',
        code: 'TEST001',
        balance: 30000.00,
      };

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newOrg)
        .expect(201);

      expect(response.body.name).toBe(newOrg.name);
      expect(response.body.code).toBe(newOrg.code);
      organizationIds.push(response.body.id);
    });

    it('should list all organizations as super admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3); // 3 from seeder + 1 created above
    });

    it('should create a new user and assign to organization', async () => {
      // First, get an organization ID from the list
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const testOrg = orgsResponse.body.find(org => org.code === 'TEST001');

      const newUser = {
        email: 'testuser@test.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        role: 'organization_admin',
        organizationId: testOrg.id,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(newUser)
        .expect(201);

      expect(response.body.email).toBe(newUser.email);
      expect(response.body.role).toBe(newUser.role);
      expect(response.body.organizationId).toBe(testOrg.id);
      userIds.push(response.body.id);
    });

    it('should update organization balance as super admin', async () => {
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = orgsResponse.body.find(org => org.code === 'ACME001');

      const response = await request(app.getHttpServer())
        .put(`/organizations/${acmeOrg.id}/balance`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ balance: 75000.00 })
        .expect(200);

      expect(parseFloat(response.body.balance)).toBe(75000.00);
    });

    it('should list all users as super admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4); // super admin + 3 org admins + 1 created
    });
  });

  describe('🏢 Flow 2: Organization Admin Operations', () => {
    beforeAll(async () => {
      // Login as Acme admin
      const acmeResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@acme.com',
          password: 'acme123',
        })
        .expect(200);

      acmeAdminToken = acmeResponse.body.access_token;

      // Login as Global admin  
      const globalResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@global.com',
          password: 'global123',
        })
        .expect(200);

      globalAdminToken = globalResponse.body.access_token;
    });

    it('should get cards for own organization only', async () => {
      // Get organization info first
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = orgsResponse.body.find(org => org.code === 'ACME001');

      const response = await request(app.getHttpServer())
        .get(`/cards/organization/${acmeOrg.id}`)
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // All cards should belong to Acme organization
      response.body.forEach(card => {
        expect(card.organizationId).toBe(acmeOrg.id);
      });

      cardIds = response.body.map(card => card.id);
    });

    it('should create a new card for own organization', async () => {
      // Get organization info
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = orgsResponse.body.find(org => org.code === 'ACME001');

      const newCard = {
        cardNumber: '9999888877776666',
        holderName: 'New Test Driver',
        dailyLimit: 400.00,
        monthlyLimit: 8000.00,
        organizationId: acmeOrg.id,
      };

      const response = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .send(newCard)
        .expect(201);

      expect(response.body.cardNumber).toBe(newCard.cardNumber);
      expect(response.body.organizationId).toBe(acmeOrg.id);
      cardIds.push(response.body.id);
    });

    it('should update card limits for own organization card', async () => {
      const cardId = cardIds[0]; // Use first card from the organization

      const newLimits = {
        dailyLimit: 600.00,
        monthlyLimit: 12000.00,
      };

      const response = await request(app.getHttpServer())
        .put(`/cards/${cardId}/limits`)
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .send(newLimits)
        .expect(200);

      expect(parseFloat(response.body.dailyLimit)).toBe(600.00);
      expect(parseFloat(response.body.monthlyLimit)).toBe(12000.00);
    });

    it('should fail to access cards from different organization', async () => {
      // Try to access a card from Global Logistics using Acme admin token
      const globalCardsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const globalOrg = globalCardsResponse.body.find(org => org.code === 'GLOBAL001');

      const response = await request(app.getHttpServer())
        .get(`/cards/organization/${globalOrg.id}`)
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .expect(403);

      expect(response.body.message).toContain('organization');
    });

    it('should fail to access all cards (super admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/cards')
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .expect(403);

      expect(response.body.message).toBe('Forbidden resource');
    });
  });

  describe('⛽ Flow 3: Fuel Station Transactions', () => {
    let testCardNumber: string;
    let lowBalanceOrgId: string;
    let lowLimitCardNumber: string;

    beforeAll(async () => {
      // Set up test data for different scenarios
      testCardNumber = '1234567890123456'; // Acme card with good limits

      // Create an organization with low balance for balance error test
      const lowBalanceOrg = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Low Balance Org',
          code: 'LOWBAL001',
          balance: 10.00, // Very low balance
        })
        .expect(201);

      lowBalanceOrgId = lowBalanceOrg.body.id;

      // Create a card for the low balance org
      const lowBalanceCard = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cardNumber: '8888777766665555',
          holderName: 'Low Balance Driver',
          dailyLimit: 1000.00,
          monthlyLimit: 20000.00,
          organizationId: lowBalanceOrgId,
        })
        .expect(201);

      // Create a card with very low limits
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = orgsResponse.body.find(org => org.code === 'ACME001');

      const lowLimitCard = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cardNumber: '7777666655554444',
          holderName: 'Low Limit Driver',
          dailyLimit: 50.00, // Very low daily limit
          monthlyLimit: 1000.00,
          organizationId: acmeOrg.id,
        })
        .expect(201);

      lowLimitCardNumber = '7777666655554444';
    });

    it('should process successful transaction', async () => {
      const transaction = {
        cardNumber: testCardNumber,
        amount: 100.00,
        transactionDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'station_key_shell_001')
        .send(transaction)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('message');

      // Verify card usage and organization balance are updated
      // This tests the saga pattern - all updates should happen together
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = orgsResponse.body.find(org => org.code === 'ACME001');
      expect(parseFloat(acmeOrg.balance)).toBeLessThan(75000.00); // Should be reduced
    });

    it('should fail transaction due to card daily limit', async () => {
      const transaction = {
        cardNumber: lowLimitCardNumber,
        amount: 100.00, // Exceeds daily limit of 50
        transactionDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'station_key_shell_001')
        .send(transaction)
        .expect(400);

      expect(response.body.message).toContain('daily limit');
    });

    it('should fail transaction due to organization balance', async () => {
      const transaction = {
        cardNumber: '8888777766665555', // Low balance org card
        amount: 50.00, // Exceeds org balance of 10.00
        transactionDate: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'station_key_shell_001')
        .send(transaction)
        .expect(400);

      expect(response.body.message).toContain('insufficient');
    });

    it('should reject transaction with invalid API key', async () => {
      const transaction = {
        cardNumber: testCardNumber,
        amount: 50.00,
        transactionDate: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'invalid_api_key')
        .send(transaction)
        .expect(401);
    });

    it('should reject transaction without API key', async () => {
      const transaction = {
        cardNumber: testCardNumber,
        amount: 50.00,
        transactionDate: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/transactions/process')
        .send(transaction)
        .expect(401);
    });
  });

  describe('🚫 Flow 4: Prevent Double Spending Scenario', () => {
    let concurrentTestOrgId: string;
    let card1Number: string;
    let card2Number: string;

    beforeAll(async () => {
      // Create organization with limited balance for concurrency test
      const concurrentOrg = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Concurrent Test Org',
          code: 'CONC001',
          balance: 500.00, // Limited balance to test double spending
        })
        .expect(201);

      concurrentTestOrgId = concurrentOrg.body.id;

      // Create two cards for the same organization
      const card1 = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cardNumber: '5555444433332222',
          holderName: 'Concurrent Driver 1',
          dailyLimit: 1000.00,
          monthlyLimit: 10000.00,
          organizationId: concurrentTestOrgId,
        })
        .expect(201);

      const card2 = await request(app.getHttpServer())
        .post('/cards')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cardNumber: '5555444433332223',
          holderName: 'Concurrent Driver 2',
          dailyLimit: 1000.00,
          monthlyLimit: 10000.00,
          organizationId: concurrentTestOrgId,
        })
        .expect(201);

      card1Number = '5555444433332222';
      card2Number = '5555444433332223';
    });

    it('should handle concurrent transactions without double spending', async () => {
      // Create two transactions that together would exceed the organization balance
      const transaction1 = {
        cardNumber: card1Number,
        amount: 300.00, // Together with transaction2 (250) = 550, exceeding 500 balance
        transactionDate: new Date().toISOString(),
      };

      const transaction2 = {
        cardNumber: card2Number,
        amount: 250.00,
        transactionDate: new Date().toISOString(),
      };

      // Execute both transactions simultaneously
      const promises = [
        request(app.getHttpServer())
          .post('/transactions/process')
          .set('X-API-KEY', 'station_key_shell_001')
          .send(transaction1),
        request(app.getHttpServer())
          .post('/transactions/process')
          .set('X-API-KEY', 'station_key_bp_002')
          .send(transaction2),
      ];

      const results = await Promise.allSettled(promises);

      // At most one transaction should succeed
      const successfulTransactions = results.filter(
        result => result.status === 'fulfilled' && (result as PromiseFulfilledResult<any>).value.status === 200
      );

      const failedTransactions = results.filter(
        result => result.status === 'fulfilled' && (result as PromiseFulfilledResult<any>).value.status !== 200
      );

      expect(successfulTransactions.length).toBeLessThanOrEqual(1);
      expect(failedTransactions.length).toBeGreaterThanOrEqual(1);

      // Verify organization balance is correct
      const orgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const concurrentOrg = orgsResponse.body.find(org => org.id === concurrentTestOrgId);
      
      if (successfulTransactions.length === 1) {
        // If one transaction succeeded, balance should be 500 - successful_amount
        // Check which transaction succeeded by looking at the response
        const successfulAmount = 300.00; // First check if it was the 300 transaction
        const expectedBalance300 = 500.00 - 300.00; // = 200.00
        const expectedBalance250 = 500.00 - 250.00; // = 250.00
        
        // The balance should be either 200 (if 300 transaction succeeded) or 250 (if 250 transaction succeeded)
        const actualBalance = parseFloat(concurrentOrg.balance);
        expect(actualBalance === 200.00 || actualBalance === 250.00).toBe(true);
        expect(actualBalance).toBeLessThan(500.00); // Should be reduced
      } else {
        // If no transactions succeeded, balance should remain unchanged
        expect(parseFloat(concurrentOrg.balance)).toBeCloseTo(500.00, 2);
      }
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Get initial balance
      const initialOrgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const initialOrg = initialOrgsResponse.body.find(org => org.id === concurrentTestOrgId);
      const initialBalance = parseFloat(initialOrg.balance);

      // Create multiple small concurrent transactions
      const smallTransactions = Array(5).fill(null).map((_, index) => ({
        cardNumber: index % 2 === 0 ? card1Number : card2Number,
        amount: 30.00, // Small amounts to test serialization
        transactionDate: new Date().toISOString(),
      }));

      const promises = smallTransactions.map((transaction, index) =>
        request(app.getHttpServer())
          .post('/transactions/process')
          .set('X-API-KEY', `station_key_shell_00${(index % 4) + 1}`)
          .send(transaction)
      );

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(
        result => result.status === 'fulfilled' && (result as PromiseFulfilledResult<any>).value.status === 200
      ).length;

      // Check final balance
      const finalOrgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const finalOrg = finalOrgsResponse.body.find(org => org.id === concurrentTestOrgId);
      const finalBalance = parseFloat(finalOrg.balance);

      // Balance should equal initial balance minus (successful transactions * 30.00)
      const expectedBalance = initialBalance - (successCount * 30.00);
      expect(finalBalance).toBeCloseTo(expectedBalance, 2);
    });
  });

  describe('🔐 Authentication & Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });

    it('should enforce role-based access control', async () => {
      // Organization admin should not access all organizations
      await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${acmeAdminToken}`)
        .expect(403);
    });
  });

  describe('📋 Data Validation', () => {
    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ name: 'Test Org' }) // Missing required 'code' field
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should validate card number format', async () => {
      const transaction = {
        cardNumber: '123', // Too short
        amount: 50.00,
        transactionDate: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'station_key_shell_001')
        .send(transaction)
        .expect(400);
    });
  });

  describe('🎯 Saga Pattern Testing', () => {
    it('should rollback all changes when transaction fails', async () => {
      // Get initial state
      const initialOrgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const acmeOrg = initialOrgsResponse.body.find(org => org.code === 'ACME001');
      const initialBalance = parseFloat(acmeOrg.balance);

      // Attempt a transaction that should fail due to some business rule
      // For example, using a card with insufficient limits
      const failingTransaction = {
        cardNumber: '7777666655554444', // Low limit card
        amount: 100.00, // Exceeds daily limit
        transactionDate: new Date().toISOString(),
      };

      await request(app.getHttpServer())
        .post('/transactions/process')
        .set('X-API-KEY', 'station_key_shell_001')
        .send(failingTransaction)
        .expect(400);

      // Verify no changes were made to organization balance
      const finalOrgsResponse = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const finalAcmeOrg = finalOrgsResponse.body.find(org => org.code === 'ACME001');
      const finalBalance = parseFloat(finalAcmeOrg.balance);

      expect(finalBalance).toBe(initialBalance); // Should remain unchanged
    });
  });
});