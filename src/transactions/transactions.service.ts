import { Inject, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { DataSource, Repository } from 'typeorm';
import {
  Transaction,
  TransactionOperation,
  TransactionStatus,
} from './entities/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { CreateTransactionFromAnotherBankAccountDto } from './dto/create-transaction-from-another-bank-account.dto';
import { PixKey } from 'src/pix-keys/entities/pix-key.entity';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(PixKey)
    private readonly pixKeyRepository: Repository<PixKey>,
    private readonly dataSource: DataSource,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaService: ClientKafka,
  ) {}

  async create(
    bankAccountId: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    const transaction = await this.dataSource.transaction(async (manager) => {
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

    const sendData = {
      id: transaction.id,
      account_id: bankAccountId,
      amount: createTransactionDto.amount,
      pix_key_to: createTransactionDto.pix_key_key,
      pix_key_kind_to: createTransactionDto.pix_key_kind,
      description: createTransactionDto.description,
    };

    await lastValueFrom(this.kafkaService.emit('transactions', sendData));

    return transaction;
  }

  findAll(bankAccountId: string) {
    return this.transactionRepository.find({
      where: { bank_account_id: bankAccountId },
      order: { created_at: 'DESC' },
    });
  }

  async createFromAnotherBankAccount(
    input: CreateTransactionFromAnotherBankAccountDto,
  ) {
    const transaction = await this.dataSource.transaction(async (manager) => {
      const pixKey = await manager.findOneOrFail(PixKey, {
        where: {
          key: input.pix_key_to,
          kind: input.pix_key_kind_to,
        },
      });

      const bankAccount = await manager.findOneOrFail(BankAccount, {
        where: { id: pixKey.bank_account_id },
        lock: { mode: 'pessimistic_write' },
      });

      const transaction = await manager.create(Transaction, {
        related_transaction_id: input.id,
        amount: input.amount,
        description: input.description,
        bank_account_id: bankAccount.id,
        bank_account_from_id: input.account_id,
        pix_key_key: input.pix_key_to,
        pix_key_kind: input.pix_key_kind_to,
        operation: TransactionOperation.credit,
        status: TransactionStatus.completed,
      });

      await manager.save(transaction);

      bankAccount.balance += transaction.amount;
      await manager.save(bankAccount);
    });

    const sendData = {
      ...input,
      status: 'confirmed',
    };

    await lastValueFrom(
      this.kafkaService.emit('transaction_confirmation', sendData),
    );

    return transaction;
  }

  async confirmTransaction(input: ConfirmTransactionDto) {
    const transaction = await this.transactionRepository.findOneOrFail({
      where: {
        id: input.id,
      },
    });

    await this.transactionRepository.update(
      { id: input.id },
      {
        status: TransactionStatus.completed,
      },
    );

    const sendData = {
      id: input.id,
      account_id: transaction.bank_account_id,
      amount: Math.abs(transaction.amount),
      pix_key_to: transaction.pix_key_key,
      pix_key_kind_to: transaction.pix_key_kind,
      description: transaction.description,
      status: TransactionStatus.completed,
    };

    await lastValueFrom(
      this.kafkaService.emit('transaction_confirmation', sendData),
    );

    return transaction;
  }
}
