import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Geo, GeoSchema } from './geo.schema';
import { GeoService } from './geo.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Geo.name, schema: GeoSchema }])],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
