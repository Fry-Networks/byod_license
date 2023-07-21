import mongoose, { mongo } from 'mongoose';
export const byodSchema = new mongoose.Schema({
	user_id: mongoose.Schema.Types.ObjectId,
    licenses: [String],
    payments: [Date]
});
export interface Byod extends mongoose.Document {
	user_id: mongoose.Schema.Types.ObjectId | string,
    licenses: string[],
    payments: Date[]
}

const ByodModel = mongoose.models.byod || mongoose.model<Byod>('byod', byodSchema);

export default ByodModel;
