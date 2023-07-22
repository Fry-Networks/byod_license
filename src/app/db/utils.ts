import UserModel, { User } from './users-schema';
import { User as ByodUser } from '../classes/LicenseProcessor';

export async function getMongoUser(address: string, email?: string): Promise<User> {
    if(email){
        if (await UserModel.exists({ email: email })) {
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
    } else {
        if(await UserModel.exists({address: address})) {
            return (await UserModel.findOne({ address: address }))!;
        } else {
            return await UserModel.create({ address: address });
        }
    }
}

export async function updateByod(byod: ByodUser, address: string) {
    const user = await getMongoUser(address);
    if(user) {
        // Only keep the licenses and payments that are not already in byod.licenses and byod.payments
        const newLicenses = byod.licenses.filter(license => !user.byod.licenses.includes(license));
        const newPayments = byod.payments ? byod.payments.filter(payment => !user.byod.payments.includes(payment)).map(payment => {
            //check if payment is a Date or a timestamp, and convert to Date if necessary
            if(typeof payment === 'number') {
                return new Date(payment);
            } else {
                return payment;
            }
        }).filter(payment => !user.byod.payments!.includes(payment)) : [];

        console.log(newLicenses);
        console.log(newPayments);

        UserModel.updateOne({ _id: user._id }, { $push: { "byod.licenses": { $each: newLicenses }, "byod.payments": { $each: newPayments } } }).then((res) => {
            console.log(res);
        }
        ).catch((err) => {
            console.log(err);
        }
        );
    } 
}
