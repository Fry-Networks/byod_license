"use server";
import algodClient from "../algodClient";
import { getPriceOfProject } from "../db/utils";
import { fetchCryptoPrice, getUser, setUser } from "./LicenseProcessor";
import algosdk from "algosdk";

const algoReceiver =
  "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E";
const fryReceiver =
  "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export async function confirmTransaction(
  txId: string,
  asset: "algo" | "fry",
  email: string
): Promise<number> {
  const USDAmount =
    process.env.NODE_ENV === "production"
      ? (await getPriceOfProject("BYOD"))?.price ?? 0
      : 0.003;

  console.log(txId, asset);

  let price = await fetchCryptoPrice(asset);
  if (!price) return 1;
  price = Math.floor(USDAmount / price) * 1000000; // Adjust to MicroAlgos

  const lowerBound = price - price * 0.05; // lower bound is 95% of the price
  const upperBound = price + price * 0.05; // upper bound is 105% of the price

  // Get the confirmed transaction
  console.log("Getting transaction info for txId: " + txId);
  await wait(2000);
  const confirmedTxn = await algodClient
    .pendingTransactionInformation(txId)
    .do();
  console.log("Got transaction info: " + JSON.stringify(confirmedTxn));
  const txnData = confirmedTxn.txn?.txn as Record<string, any> | undefined;
  if (!txnData) return 6;

  // Check if the receiver is correct
  const actualReceiverField = asset === "algo" ? "rcv" : "arcv";
  const actualReceiverBytes = txnData[actualReceiverField];
  if (!actualReceiverBytes) return 2;
  const actualReceiver = algosdk.encodeAddress(actualReceiverBytes);
  const receiver = asset === "algo" ? algoReceiver : fryReceiver;
  if (actualReceiver !== receiver) return 2;

  // Check if the amount is correct (assuming price is in MicroAlgos)
  const amountField = asset === "algo" ? "amt" : "aamt";
  const amount = Number(txnData[amountField] || 0); // Default to 0 if amt field is missing
  if (amount < lowerBound || amount > upperBound) return 3;

  // If everything passed return true
  try {
    let user = await getUser(email);
    if (!user) return 4;
    user[asset] = true;
    if (!user.address && txnData.snd) {
      user.address = algosdk.encodeAddress(txnData.snd);
    }
    await setUser(user);
  } catch (error) {
    console.error(error);
    return 5;
  }

  return 0;
}
