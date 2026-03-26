import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AddressDocument = CachedAddress & Document;

@Schema({ collection: 'addresses', timestamps: true })
export class CachedAddress {
  @Prop({ required: true, unique: true, index: true })
  address: string;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;

  @Prop({ required: true })
  expiresAt: Date;
}

export const CachedAddressSchema = SchemaFactory.createForClass(CachedAddress);

CachedAddressSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
