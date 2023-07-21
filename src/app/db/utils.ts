import UserModel, { User } from './users-schema';
import { User as ByodUser} from '../classes/LicenseProcessor';
import ByodModel from './byod-schema';

export async function createMongoUser(email: string, address: string): Promise<User> {
    if(await UserModel.exists({ email: email })) {
        const user = await UserModel.findOne({ email: email });
        user.address = address;
        await user.save();
        return user
    } else if (await UserModel.exists({ address: address })) {
        const user = await UserModel.findOne({ address: address });
        user.email = email;
        await user.save();
        return user
    } else if (await UserModel.exists({ email: email, address: address })) {
        return (await UserModel.findOne({ email: email, address: address }))!;
    } else {
        return await UserModel.create({ email: email, address: address });
    }
}
export async function updateByod(user: ByodUser, user_id: string) {
    const byod = await ByodModel.findOne({ user_id: user_id });
    if(byod) {
        // Only keep the licenses and payments that are not already in byod.licenses and byod.payments
        const newLicenses = user.licenses.filter(license => !byod.licenses.includes(license));
        const newPayments = user.payments ? user.payments.filter(payment => !byod.payments.includes(payment)) : [];
        
        await ByodModel.updateOne({ user_id: user_id }, { $push: { licenses: { $each: newLicenses }, payments: { $each: newPayments } } });
    } else {
        await ByodModel.create({ user_id: user_id, licenses: user.licenses, payments: user.payments });
    }
}
