import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppLoggerService } from '../../common/logger/logger.service';
import { TransactionCreatedEvent, TransactionApprovedEvent, TransactionRejectedEvent } from '../events/transaction.events';

@Injectable()
export class TransactionListener {
  constructor(private readonly logger: AppLoggerService) {}

  @OnEvent('transaction.created')
  handleTransactionCreated(event: TransactionCreatedEvent) {
    this.logger.log(
      `🆕 Transaction Created: ID=${event.transactionId}, Card=${event.cardId}, Org=${event.organizationId}, Amount=${event.amount}, Status=${event.status}`,
      'TransactionEvents'
    );
    
    // Additional business logic:
    // - Send notification to organization admin
    // - Update analytics/metrics
    // - Audit trail logging
  }

  @OnEvent('transaction.approved')
  handleTransactionApproved(event: TransactionApprovedEvent) {
    this.logger.log(
      `✅ Transaction Approved: ID=${event.transactionId}, Card=${event.cardId}, Org=${event.organizationId}, Amount=${event.amount}`,
      'TransactionEvents'
    );
    
    // Additional business logic:
    // - Send success notification to driver/admin
    // - Update real-time dashboard
    // - Analytics tracking
    // - Receipt generation
  }

  @OnEvent('transaction.rejected')
  handleTransactionRejected(event: TransactionRejectedEvent) {
    this.logger.warn(
      `❌ Transaction Rejected: ID=${event.transactionId}, Card=${event.cardId}, Org=${event.organizationId}, Amount=${event.amount}, Reason=${event.reason}`,
      'TransactionEvents'
    );
    
    // Additional business logic:
    // - Send rejection notification to driver/admin
    // - Alert system for repeated rejections
    // - Fraud detection patterns
    // - Analytics for rejection reasons
  }

  @OnEvent('transaction.created')
  handleTransactionAnalytics(event: TransactionCreatedEvent) {
    // Separate handler for analytics to keep concerns separated
    this.logger.debug(
      `📊 Analytics: Processing transaction metrics for Org=${event.organizationId}, Amount=${event.amount}`,
      'TransactionAnalytics'
    );
    
    // Business logic:
    // - Update daily/monthly statistics
    // - Track usage patterns
    // - Generate insights
  }
}