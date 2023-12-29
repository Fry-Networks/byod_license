import mongoose, { mongo } from 'mongoose';
export const byodSchema = new mongoose.Schema({
    email: { type: String, default: ""},
    algo: {type: Boolean, default: false},
    fry: {type: Boolean, default: false},
    licenses: { type: [String], default: [] },
    payments: { type: [Date], default: [] }
    
 
});
export interface Byod extends mongoose.Document {
    email: string,
    algo: boolean,
    fry: boolean,
    licenses: string[],
    payments: Date[]
}

const ByodModel = mongoose.models.byod || mongoose.model<Byod>('byod', byodSchema);


export default ByodModel;