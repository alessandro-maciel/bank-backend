import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';
import { PixKey } from 'src/pix-keys/entities/pix-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, BankAccount, PixKey])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
