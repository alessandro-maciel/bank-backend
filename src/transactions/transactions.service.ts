import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DataSource, Repository } from 'typeorm';
import {
  Transaction,
  TransactionOperation,
} from './entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    bankAccountId: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const bankAccount = await manager.findOneOrFail(BankAccount, {
        where: { id: bankAccountId },
        lock: { mode: 'pessimistic_write' },
      });

      const transaction = manager.create(Transaction, {
        ...createTransactionDto,
        amount: createTransactionDto.amount * -1,
        bank_account_id: bankAccountId,
        operation: TransactionOperation.debit,
      });

      await manager.save(transaction);

      bankAccount.balance += transaction.amount;
      await manager.save(bankAccount);

      return transaction;
    });
  }

  findAll(bankAccountId: string) {
    return this.transactionRepository.find({
      where: { bank_account_id: bankAccountId },
      order: { created_at: 'DESC' },
    });
  }
}
