import { Injectable } from '@nestjs/common';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';
import { Repository } from 'typeorm';
import { PixKey } from './entities/pix-key.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BankAccount } from 'src/bank-accounts/entities/bank-account.entity';

@Injectable()
export class PixKeysService {
  constructor(
    @InjectRepository(PixKey)
    private readonly pixKeyRepository: Repository<PixKey>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
  ) {}

  async create(bankAccountId: string, createPixKeyDto: CreatePixKeyDto) {
    await this.bankAccountRepository.findOneOrFail({
      where: { id: bankAccountId },
    });

    //logica para consultar se a chave pix existe no banco central

    return this.pixKeyRepository.save({
      bank_account_id: bankAccountId,
      ...createPixKeyDto,
    });
  }

  findAll(bankAccountId: string) {
    return this.pixKeyRepository.find({
      where: { bank_account_id: bankAccountId },
      order: { create_at: 'DESC' },
    });
  }
}
