import algosdk from "algosdk";
import { DEFAULT_NODE_BASEURL, DEFAULT_NODE_PORT, DEFAULT_NODE_TOKEN } from "@txnlab/use-wallet";
const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  "https://xna-mainnet-api.algonode.cloud/",
  443
);

export default algodClient;
