'use server';
import algodClient from "../algodClient";
import { fetchCryptoPrice } from "./LicenseProcessor";
import algosdk from 'algosdk';

const USDAmount = process.env.NODE_ENV === 'production' ? 52.50 : 0.01;
const receiver = "ATPVJYGEGP5H6GCZ4T6CG4PK7LH5OMWXHLXZHDPGO7RO6T3EHWTF6UUY6E"

export async function confirmTransaction(txId: string): Promise<boolean> {
    let price = await fetchCryptoPrice();
    if (!price) return false;
    price = Math.floor((USDAmount / price)) * 1000000; // Adjust to MicroAlgos

    const lowerBound = price - (price * 0.05); // lower bound is 95% of the price
    const upperBound = price + (price * 0.05); // upper bound is 105% of the price

    // Get the confirmed transaction
    const confirmedTxn = await algodClient.pendingTransactionInformation(txId).do();

    console.log(confirmedTxn);

    // Check if the receiver is correct
    const actualReceiver = algosdk.encodeAddress(confirmedTxn['txn']['txn']['arcv']);
    console.log(actualReceiver, receiver);
    if (actualReceiver !== receiver) return false;

    // Check if the amount is correct (assuming price is in MicroAlgos)
    console.log(confirmedTxn['txn']['txn']['aamt'], lowerBound, upperBound);
    if (!confirmedTxn['txn']['txn']['aamt'] || confirmedTxn['txn']['txn']['aamt'] < lowerBound || confirmedTxn['txn']['txn']['aamt'] > upperBound) return false;

    // If everything passed return true
    return true;
}
