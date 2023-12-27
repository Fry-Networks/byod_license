import algosdk from "algosdk";
/*
const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  "https://xna-mainnet-api.algonode.cloud/",
  443
);
*/
const algodClient = new algosdk.Algodv2(
  "",
  "https://mainnet-api.algonode.cloud",
  ""
);

export default algodClient;
