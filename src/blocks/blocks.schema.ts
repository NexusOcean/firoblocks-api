import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = CachedBlock & Document;

@Schema({ collection: 'blocks', timestamps: true })
export class CachedBlock {
  @Prop({ required: true, unique: true, index: true })
  hash: string;

  @Prop({ required: true, unique: true, index: true })
  height: number;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;
}

export const CachedBlockSchema = SchemaFactory.createForClass(CachedBlock);
