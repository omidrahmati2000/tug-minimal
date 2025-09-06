export class TransactionCreatedEvent {
  constructor(
    public readonly transactionId: number,
    public readonly cardId: number,
    public readonly organizationId: number,
    public readonly amount: number,
    public readonly status: string,
  ) {}
}

export class TransactionApprovedEvent {
  constructor(
    public readonly transactionId: number,
    public readonly cardId: number,
    public readonly organizationId: number,
    public readonly amount: number,
  ) {}
}

export class TransactionRejectedEvent {
  constructor(
    public readonly transactionId: number,
    public readonly cardId: number,
    public readonly organizationId: number,
    public readonly amount: number,
    public readonly reason: string,
  ) {}
}