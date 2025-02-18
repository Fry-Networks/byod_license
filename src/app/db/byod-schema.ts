import mongoose, { mongo } from "mongoose";
export const byodSchema = new mongoose.Schema({
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  algo: { type: Boolean, default: false },
  fry: { type: Boolean, default: false },
  stripe: { type: Boolean },
  licenses: { type: [{ license: String, used: Boolean }], default: [] },
  payments: { type: [{ date: Date, price: Number }], default: [] },
});
export interface Byod extends mongoose.Document {
  email: string;
  address: string;
  algo: boolean;
  fry: boolean;
  stripe?: boolean;
  licenses: { license: string; used: boolean }[];
  payments: { date: Date; price: number }[];
}

const ByodModel =
  mongoose.models.byod || mongoose.model<Byod>("byod", byodSchema);

export default ByodModel;
