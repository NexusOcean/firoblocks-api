import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RpcService } from '../rpc/rpc.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CachedAddress, AddressDocument } from './addresses.schema';
import {
  FiroAddressBalance,
  FiroAddressTxIds,
  AddressDto,
  AddressTxSummaryDto,
} from './addresses.types';
import { TransactionDto } from '../transactions/transactions.types';

const SATOSHIS = 1e8;
const PAGE_SIZE = 25;
const CONCURRENCY = 10;
const ADDRESS_TTL_MS = 5 * 60 * 1000; // 5 minutes — increased to allow background hydration to complete

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(
    private readonly rpc: RpcService,
    private readonly txService: TransactionsService,
    @InjectModel(CachedAddress.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  async getAddress(address: string, page = 1): Promise<AddressDto> {
    const cached = await this.addressModel.findOne({ address }).lean();

    if (cached) {
      const dto = cached.data as unknown as AddressDto;
      const totalPages = Math.max(1, Math.ceil(dto.totalTxCount / PAGE_SIZE));
      const clampedPage = Math.min(Math.max(1, page), totalPages);
      const hydratedPages = Math.ceil(dto.transactions.length / PAGE_SIZE);

      // Requested page is not yet hydrated — fetch it on demand and update cache
      if (clampedPage > hydratedPages) {
        return this.hydratePage(address, dto, clampedPage);
      }

      return this.paginateDto(dto, page);
    }

    const [balanceRaw, allTxIds] = await Promise.all([
      this.rpc.call<FiroAddressBalance>('getaddressbalance', [{ addresses: [address] }]),
      this.rpc.call<FiroAddressTxIds>('getaddresstxids', [{ addresses: [address] }]),
    ]);

    if (!allTxIds) throw new NotFoundException(`Address ${address} not found`);

    const totalTxCount = allTxIds.length;
    const totalPages = Math.max(1, Math.ceil(totalTxCount / PAGE_SIZE));
    const reversed = [...allTxIds].reverse();

    // Only hydrate first page for immediate response
    const firstPageTxids = reversed.slice(0, PAGE_SIZE);
    const firstPageTxs = await this.hydrateIds(firstPageTxids);

    const dto: AddressDto = {
      address,
      balance: balanceRaw.balance / SATOSHIS,
      received: balanceRaw.received / SATOSHIS,
      totalTxCount,
      transactions: firstPageTxs.map((tx) => this.toSummaryDto(tx, address)),
      page: 1,
      totalPages,
      hydrating: totalTxCount > PAGE_SIZE, // signal to frontend that more is loading
    };

    await this.cache(address, dto);

    // Hydrate remaining pages in background without blocking response
    if (reversed.length > PAGE_SIZE) {
      this.hydrateRemaining(address, reversed.slice(PAGE_SIZE), dto).catch((err) =>
        this.logger.warn(`Background hydration failed for ${address}: ${err}`),
      );
    }

    return this.paginateDto(dto, page);
  }

  // Called when a user requests a page that hasn't been hydrated yet
  private async hydratePage(address: string, dto: AddressDto, page: number): Promise<AddressDto> {
    const allTxIds = await this.rpc.call<FiroAddressTxIds>('getaddresstxids', [
      { addresses: [address] },
    ]);

    const reversed = [...allTxIds].reverse();
    const start = (page - 1) * PAGE_SIZE;
    const pageTxids = reversed.slice(start, start + PAGE_SIZE);
    const pageTxs = await this.hydrateIds(pageTxids);
    const pageSummaries = pageTxs.map((tx) => this.toSummaryDto(tx, address));

    // Fill any gaps with placeholders so slice indexing stays correct
    const updatedTransactions = [...dto.transactions];
    while (updatedTransactions.length < start) {
      updatedTransactions.push(null as any);
    }
    updatedTransactions.splice(start, PAGE_SIZE, ...pageSummaries);

    const updatedDto: AddressDto = {
      ...dto,
      transactions: updatedTransactions,
    };

    await this.cache(address, updatedDto);
    return this.paginateDto(updatedDto, page);
  }

  private async hydrateRemaining(
    address: string,
    remainingTxids: string[],
    dto: AddressDto,
  ): Promise<void> {
    const remainingTxs = await this.hydrateIds(remainingTxids);
    const remainingSummaries = remainingTxs.map((tx) => this.toSummaryDto(tx, address));

    const updatedDto: AddressDto = {
      ...dto,
      transactions: [...dto.transactions, ...remainingSummaries],
      hydrating: false,
    };

    await this.cache(address, updatedDto);
    this.logger.log(`Background hydration complete for ${address}`);
  }

  private paginateDto(dto: AddressDto, page: number): AddressDto {
    const totalPages = Math.max(1, Math.ceil(dto.totalTxCount / PAGE_SIZE));
    const clampedPage = Math.min(Math.max(1, page), totalPages);
    const start = (clampedPage - 1) * PAGE_SIZE;

    return {
      ...dto,
      transactions: dto.transactions.filter(Boolean).slice(start, start + PAGE_SIZE),
      page: clampedPage,
      totalPages,
    };
  }

  private async cache(address: string, dto: AddressDto): Promise<void> {
    const expiresAt = new Date(Date.now() + ADDRESS_TTL_MS);
    await this.addressModel.updateOne(
      { address },
      { $set: { address, data: dto, expiresAt } },
      { upsert: true },
    );
  }

  private async hydrateIds(txids: string[]): Promise<TransactionDto[]> {
    const results: TransactionDto[] = [];

    for (let i = 0; i < txids.length; i += CONCURRENCY) {
      const batch = txids.slice(i, i + CONCURRENCY);
      const settled = await Promise.allSettled(
        batch.map((id) => this.txService.getTransaction(id)),
      );

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.warn(`Failed to hydrate tx: ${result.reason}`);
        }
      }
    }

    return results;
  }

  private toSummaryDto(tx: TransactionDto, address: string): AddressTxSummaryDto {
    const totalOut = tx.vout
      .filter((v) => v.addresses.includes(address))
      .reduce((s, v) => s + v.value, 0);

    const totalIn = tx.vin
      .filter((v) => v.address === address)
      .reduce((s, v) => s + (v.value ?? 0), 0);

    const valueDelta =
      tx.type === 'transparent' || tx.type === 'coinbase'
        ? parseFloat((totalOut - totalIn).toFixed(8))
        : undefined;

    return {
      txid: tx.txid,
      type: tx.type,
      time: tx.time,
      blockHeight: tx.blockHeight,
      confirmations: tx.confirmations,
      valueDelta,
    };
  }
}
