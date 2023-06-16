import React from "react";
import { useWallet } from "@txnlab/use-wallet";

export default function Connect() {
  const { providers, activeAccount } = useWallet();

  // Define styles for the buttons and select
  const elementStyle = {
    backgroundColor: '#4CAF50', /* Green */
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '12px', // Rounded corners
    width: '150px', // Set the width to a specific value
  };

  // Check if any provider is connected
  const anyConnected = providers?.some(provider => provider.isConnected);

  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      {providers?.map((provider) => (
  (provider.isConnected || !anyConnected) && (
    <div key={"provider-" + provider.metadata.id} style={{ margin: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      
      {/* Always display the provider name and image */}
      <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img width={30} height={30} alt="" src={provider.metadata.icon} style={{
          marginRight: '10px',
        }} />
        {provider.metadata.name} {provider.isActive && "[active]"}
      </h4>
      
      {!anyConnected && (
        <button style={elementStyle} onClick={provider.connect}>
          Connect
        </button>
      )}
      
      {provider.isConnected && provider.isActive && provider.accounts.length && (
        <select
          style={{
            ...elementStyle,
            width: undefined
          }}
          value={activeAccount ? activeAccount.address : "Address"}
          onChange={(e) => provider.setActiveAccount(e.target.value)}
        >
          <option value="Address" disabled>Address</option>
          {provider.accounts.map((account) => (
            <option
              key={"account-" + account.address}
              value={account.address}
            >
              {account.address}
            </option>
          ))}
        </select>
      )}
  {provider.isConnected && (
      <button
        onClick={provider.disconnect}
        disabled={!provider.isConnected}
        style={{...elementStyle,
          backgroundColor: 'red',
        }}
      >
        Disconnect
      </button>
  )}

    </div>
  )
))}

    </div>
  );
}
