import UserModel, { User } from "./users-schema";
import { User as ByodUser } from "../classes/LicenseProcessor";
import PriceModel from "./price-schema";
import { connect } from "./connect";

export async function getMongoUser({
  address,
  email,
}: {
  address?: string;
  email?: string;
}): Promise<User> {
  if (email && address) {
    if (await UserModel.exists({ email: email, address: address })) {
      return (await UserModel.findOne({ email: email, address: address }))!;
    } else if (await UserModel.exists({ email: email })) {
      const user = await UserModel.findOne({ email: email });
      user.address = address;
      await user.save();
      return user;
    } else if (await UserModel.exists({ address: address })) {
      const user = await UserModel.findOne({ address: address });
      user.email = email;
      await user.save();
      return user;
    } else {
      return await UserModel.create({ email: email, address: address });
    }
  } else if (email) {
    if (await UserModel.exists({ email: email })) {
      return (await UserModel.findOne({ email: email }))!;
    } else {
      return await UserModel.create({ email: email });
    }
  } else if (address) {
    if (await UserModel.exists({ address: address })) {
      return (await UserModel.findOne({ address: address }))!;
    } else {
      return await UserModel.create({ address: address });
    }
  }
  throw new Error("Both email and address are missing");
}
export async function updateByod(byod: ByodUser, address: string) {
  const user = await getMongoUser({ address });
  if (user) {
    // Only keep the licenses and payments that are not already in byod.licenses and byod.payments
    const newLicenses = byod.licenses
      .filter((license) => !user.byod.licenses.includes(license.license))
      .map((license) => license.license);
    const newPayments = byod.payments
      ? byod.payments
          .filter((payment) => !user.byod.payments.includes(payment.date))
          .map((payment) => {
            //check if payment is a Date or a timestamp, and convert to Date if necessary
            if (typeof payment.date === "number") {
              return new Date(payment.date);
            } else {
              return payment.date;
            }
          })
          .filter((payment) => !user.byod.payments!.includes(payment))
      : [];

    await UserModel.updateOne(
      { _id: user._id },
      {
        $push: {
          "byod.licenses": { $each: newLicenses },
          "byod.payments": { $each: newPayments },
        },
        $set: { address },
      }
    )
      .then((res) => {})
      .catch((err) => {
        console.log(err);
      });
  }
}

export async function getPriceOfProject(projectName: string) {
  try {
    await connect(); // Ensure DB connection before query
    const price = await PriceModel.findOne({ project_name: projectName });

    return price || null; // Return price or null if not found
  } catch (error) {
    console.error("Error fetching project price:", error);
    return null; // Handle errors gracefully
  }
}
