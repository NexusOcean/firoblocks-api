import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = CachedBlock & Document;

@Schema({ collection: 'blocks', timestamps: true })
export class CachedBlock {
  @Prop({ required: true, unique: true, index: true })
  hash: string;

  @Prop({ required: true, index: true })
  height: number;

  @Prop({ type: Object, required: true })
  data: Record<string, unknown>;

  @Prop({ required: true })
  expiresAt: Date;
}

export const CachedBlockSchema = SchemaFactory.createForClass(CachedBlock);

// Documents are deleted automatically when expiresAt is reached
CachedBlockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
