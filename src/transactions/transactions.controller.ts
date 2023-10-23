import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('bank-accounts/:bankAccountId/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Param('bankAccountId') bankAccountId: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(bankAccountId, createTransactionDto);
  }

  @Get()
  findAll(@Param('bankAccountId') bankAccountId: string) {
    return this.transactionsService.findAll(bankAccountId);
  }
}
