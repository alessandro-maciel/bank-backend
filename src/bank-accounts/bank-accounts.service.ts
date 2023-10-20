import { Injectable } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { Repository } from 'typeorm';
import { BankAccount } from './entities/bank-account.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepo: Repository<BankAccount>,
  ) {}

  create(createBankAccountDto: CreateBankAccountDto) {
    return this.bankAccountRepo.save(createBankAccountDto);
  }

  findAll() {
    return this.bankAccountRepo.find();
  }

  findOne(id: string) {
    return this.bankAccountRepo.findOneOrFail({
      where: { id },
    });
  }
}
