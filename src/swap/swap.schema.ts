import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SwapMappingDocument = HydratedDocument<SwapMapping>;

@Schema({ timestamps: false, collection: 'swap_mappings' })
export class SwapMapping {
  @Prop({ required: true, unique: true, index: true })
  opaqueId!: string;

  @Prop({ required: true })
  exchangeId!: string;

  @Prop({ required: true })
  provider!: string;

  @Prop({ required: true, expires: '7d', default: Date.now })
  createdAt!: Date;
}

export const SwapMappingSchema = SchemaFactory.createForClass(SwapMapping);
