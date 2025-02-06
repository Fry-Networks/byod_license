import mongoose, { mongo } from "mongoose";
import { object } from "prop-types";
export const priceSchema = new mongoose.Schema({
  no: Number,
  project_name: String,
  price: Number,
  asset_id: String,
});
export interface Price extends mongoose.Document {
  no: number;
  project_name: string;
  price: number;
  asset_id: string;
}

const PriceModel = (mongoose.models.prices ||
  mongoose.model<Price>("prices", priceSchema)) as mongoose.Model<Price>;

export default PriceModel;
