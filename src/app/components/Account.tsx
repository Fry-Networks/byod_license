import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";

export default function Account() {
  const { activeAccount, activeWallet } = useWallet();

  if (!activeAccount) {
    return <p>Connect an account first.</p>;
  }

  return (
    <div>
      <h4>Active Account</h4>
      <p>
        Name: <span>{activeAccount.name}</span>
      </p>
      <p>
        Address: <span>{activeAccount.address}</span>
      </p>
      <p>
        Provider: <span>{activeWallet?.metadata?.name || "Unknown"}</span>
      </p>
    </div>
  );
}
