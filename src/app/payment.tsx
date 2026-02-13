'use client';
import React, { useMemo } from 'react';
import { WalletProvider } from "@txnlab/use-wallet-react";
import { WalletId, WalletManager } from "@txnlab/use-wallet";
import Connect from "./components/Connect";
import Transact from "./components/Transact";

export default function Payment() {
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '74761852c2f607c540bb116a1bc9f011';
    const walletManager = useMemo(
        () =>
            new WalletManager({
                wallets: [
                    WalletId.DEFLY,
                    WalletId.PERA,
                    {
                        id: WalletId.WALLETCONNECT,
                        options: {
                            projectId: walletConnectProjectId,
                            metadata: {
                                name: 'BYOD License',
                                description: 'BYOD license payment dapp',
                                url: 'https://byod.frynetworks.com',
                                icons: ['https://walletconnect.com/walletconnect-logo.png']
                            }
                        }
                    }
                ]
            }),
        [walletConnectProjectId]
    );

    return (
        <div
            style={{
                ...containerStyle
            }}
        >
            <WalletProvider manager={walletManager}>
                <div style={{
                    ...cardStyle,
                    width: '100vw'
                }}>
                    <div style={{ marginTop: '20px', }}>
                        <Transact />
                    </div>
                    <Connect />

                </div>
            </WalletProvider>

        </div>



    );
}


const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '90vw',
    color: 'white',
    background: 'rgb(28, 28, 28)',
    padding: '20px',
    margin: 'auto',
} as const;

const cardStyle = {
    display: 'flex',
    flexDirection: 'column-reverse',
    padding: "20px",
    background: '#84808a',
    borderRadius: '10px',
    boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
    width: '90vw',
} as const;
