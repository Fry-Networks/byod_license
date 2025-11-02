"use server";
import nodemailer from "nodemailer";
import axios from "axios";
import { google } from "googleapis";
import key from "../../../config/serviceAcc.json"; // replace with your json key file path
import { sendMailApi } from "./MailProcessor";
import fs from "fs";
import path from "path";
import { confirmTransaction } from "./TransactionProcessor";
import { getMongoUser, getPriceOfProject, updateByod } from "../db/utils";
import { connect } from "../db/connect";
import ByodModel, { Byod } from "../db/byod-schema";
import PriceModel from "../db/price-schema";

connect();
//export to json file
export type User = {
  email: string;
  address?: string;
  algo: boolean;
  fry: boolean;
  stripe?: boolean;
  licenses: { license: string; used: boolean }[];
  payments?: { date: Date; price: number }[];
};

export type UserData = {
  algo: boolean;
  fry: boolean;
};

//const capKey = "REDACTED_ROTATE_ME"
//const FRYCapID = 24874;
//const AlgoCapID = 4030;

const algoURL = "https://api.vestigelabs.org/assets/price?asset_ids=0";
let currentFRYPrice = {
  lastFetched: 0,
  price: 0,
};
let currentAlgoPrice = {
  lastFetched: 0,
  price: 0,
};

async function fetchFromTinyMan(assetId: string) {
  try {
    // TinyMan API endpoint for FRY price
    const tinymanURL = `https://mainnet.analytics.tinyman.org/api/v1/assets/${assetId}/`;
    const response = await axios.get(tinymanURL);
    if (response.data && response.data.price_in_usd) {
      return parseFloat(response.data.price_in_usd);
    }
    return null;
  } catch (error) {
    console.warn("TinyMan API fetch failed:", error);
    return null;
  }
}

async function fetchFromVestigeLabs(assetId: string) {
  try {
    const vestigeURL = `https://api.vestigelabs.org/assets/price?asset_ids=${assetId}`;
    const response = await axios.get(vestigeURL);
    if (response.data && response.data.length > 0) {
      return parseFloat(response.data[0].price);
    }
    return null;
  } catch (error) {
    console.warn("VestigeLabs API fetch failed:", error);
    return null;
  }
}

function calculateDynamicFactor(
  vestigePrice: number,
  tinymanPrice: number | null
): number | null {
  // If we have both prices, use TinyMan as the reference (more reliable)
  if (tinymanPrice && vestigePrice) {
    const factor = tinymanPrice / vestigePrice;
    console.log(
      `Dynamic factor calculated: ${tinymanPrice} / ${vestigePrice} = ${factor}`
    );
    return factor;
  }

  // If only TinyMan price available, we can't calculate a factor
  if (tinymanPrice && !vestigePrice) {
    console.log("Only TinyMan price available, using direct price");
    return null; // We'll use TinyMan price directly
  }

  // If neither price is available or only Vestige available, return null for fallback
  return null;
}

export async function getFRYPrice() {
  const FRYVerID = (await getPriceOfProject("BYOD"))?.asset_id ?? 2485314946;

  if (Date.now() - currentFRYPrice.lastFetched > 1000 * 60 * 1) {
    // Fetch from multiple sources
    const vestigePrice = await fetchFromVestigeLabs(FRYVerID.toString());
    const tinymanPrice = await fetchFromTinyMan(FRYVerID.toString());

    let finalPrice: number;

    // Priority: TinyMan direct price > Dynamic factor > Fallback factor
    if (tinymanPrice) {
      // Use TinyMan price directly (most reliable)
      finalPrice = tinymanPrice;
      console.log(`Using TinyMan direct price: $${finalPrice}`);
    } else if (vestigePrice) {
      // Calculate dynamic factor or use fallback
      const dynamicFactor =
        calculateDynamicFactor(vestigePrice, tinymanPrice) || 0.175;
      finalPrice = vestigePrice * dynamicFactor;
      console.log(
        `Using Vestige price with ${
          dynamicFactor === 0.175 ? "fallback" : "dynamic"
        } factor: ${vestigePrice} * ${dynamicFactor} = ${finalPrice}`
      );
    } else {
      // Complete fallback - use cached price or default
      console.error("All price sources failed, using cached/default price");
      return currentFRYPrice.price || 0.0099; // Default to $0.0099 if no cache
    }

    currentFRYPrice.price = parseFloat(finalPrice.toFixed(6));
    currentFRYPrice.lastFetched = Date.now();
  }

  console.log("Final FRY price:", currentFRYPrice.price);
  return currentFRYPrice.price;
}

export async function getAlgoPrice() {
  if (Date.now() - currentAlgoPrice.lastFetched > 1000 * 60 * 1) {
    const response = await axios.get(algoURL);
    if (!response.data || response.data.length === 0) {
      console.error("Failed to fetch ALGO price data");
      return currentAlgoPrice.price;
    }
    const price = (parseFloat(response.data[0].price) * 2) / 10;
    currentAlgoPrice.price = parseFloat(price.toFixed(6));
    currentAlgoPrice.lastFetched = Date.now();
  }
  return currentAlgoPrice.price;
}

export async function getUser(email: string): Promise<User | null> {
  const user = await ByodModel.findOne({ email });
  return user ? user.toObject() : null;
}
export async function setUser(user: User) {
  ByodModel.findOneAndUpdate({ email: user.email }, user, {
    upsert: true,
    new: true,
  }).exec();
  console.log("set user");
}

export async function getUserData(email: string): Promise<UserData> {
  const user = await getUser(email);
  if (!user) {
    return {
      algo: false,
      fry: false,
    };
  }
  return {
    algo: user.algo,
    fry: user.fry,
  };
}

export async function isUser(email: string) {
  return (await ByodModel.exists({ email })) ? true : false;
}

export async function addLicense(
  email: string,
  address: string,
  license: string
) {
  if (await isUser(email)) {
    const user = (await getUser(email)) as User;
    user.licenses
      ? user.licenses.push({ license, used: false })
      : (user.licenses = [{ license, used: false }]);
    user.fry = true;
    if (!user.payments) {
      user.payments = [
        {
          date: new Date(),
          price: (await getPriceOfProject("BYOD"))?.price ?? 105,
        },
      ];
    } else {
      user.payments.push({
        date: new Date(),
        price: (await getPriceOfProject("BYOD"))?.price ?? 105,
      });
    }
    user.address = address;
    setUser(user);
    updateByod(user, address);
  } else {
    const user = {
      email: email,
      licenses: [{ license, used: false }],
      algo: true,
      fry: false,
      payments: [
        {
          date: new Date(),
          price: (await getPriceOfProject("BYOD"))?.price ?? 105,
        },
      ],
    };
    setUser(user);
    updateByod(user, address);
  }
}

export async function createLicense(
  email: string,
  address: string,
  txId: string
) {
  let license = (
    Math.random().toString(36).substring(2, 40) +
    Math.random().toString(36).substring(2, 40) +
    Math.random().toString(36).substring(2, 40)
  ).toUpperCase();
  while (await ByodModel.exists({ ["licenses.license"]: license })) {
    license = (
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40)
    ).toUpperCase();
  }
  const user = await getUser(email);
  if (!user) {
    console.log("User not found");
    return null;
  }
  // if (!user.algo) {
  //   console.log("User has not paid for algo");
  //   return null;
  // }
  const confirmation = await confirmTransaction(txId, "fry", email);
  if (confirmation !== 0) return "spoofed transaction code: " + confirmation;
  await connect();
  await getMongoUser({ address, email });
  console.log(
    `Creating license for ${email} with address ${address}: ${license}`
  );
  await addLicense(email, address, license);
  await sendMail(email, license);
  /*
    try {
        if (process.env.NODE_ENV === 'production') syncLicensesGSheet();
    } catch (err) {
        console.log(err);
    }
    */

  return license;
}

export async function createUser(email: string) {
  const user = {
    email,
    licenses: [],
    algo: true,
    fry: false,
  };
  setUser(user);
  return user;
}

export async function sendMail(email: string, license: string) {
  //read the html file here ../../../config/HTMLtemplate.html

  const htmlFile = fs.readFileSync(
    path.resolve(__dirname, "../../../config/HTMLtemplate.html"),
    "utf8"
  );

  const edited = htmlFile.replace("LICENSE_REPLACE_TEXT", license);

  const options = {
    from: "contact@fryfoundation.com",
    to: email,
    subject: "Your FRY BYOD License",
    text:
      "Your FRY BYOD License is: " +
      license +
      ". Please save this email for future reference.",
    html: edited,
  };
  await sendMailApi(options);
}

export async function fetchCryptoPrice(asset: "algo" | "fry") {
  try {
    if (asset === "algo") {
      return await getAlgoPrice();
    } else {
      return await getFRYPrice();
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export async function repayLicense(email: string) {
  const user = await getUser(email);
  if (!user) return false;
  //@ts-ignore

  const condition = user.stripe
    ? user.fry && user.stripe
    : user.fry && user.algo;
  if (condition) {
    user.fry = false;
    user.algo = true;
    await setUser(user);
  }
  return condition;
}
