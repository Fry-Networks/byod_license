'use client';
import React, { useEffect } from 'react';
import {
    reconnectProviders,
    useInitializeProviders,
    WalletProvider,
    PROVIDER_ID,
    algosigner,
    useWallet
} from "@txnlab/use-wallet";
import Connect from "./components/Connect";
import Transact from "./components/Transact";
import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'
import MyAlgoConnect from '@randlabs/myalgo-connect';
import { WalletConnectModalSign } from '@walletconnect/modal-sign-html'



export default function Payment() {
    const walletProviders = useInitializeProviders({
        providers: [
            { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
            { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
            { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
            { id: PROVIDER_ID.MYALGO, clientStatic: MyAlgoConnect },
            {
                id: PROVIDER_ID.WALLETCONNECT,
                clientStatic: WalletConnectModalSign,
                clientOptions: {
                    projectId: '74761852c2f607c540bb116a1bc9f011',
                    metadata: {
                        name: 'Example Dapp',
                        description: 'Example Dapp',
                        url: '#',
                        icons: ['https://walletconnect.com/walletconnect-logo.png']
                    }
                }
            }
        ]
    })
    useEffect(() => {
        if (walletProviders !== null) {
            reconnectProviders(walletProviders);
        }
    }, []);
    return (
        <div
            style={{
                ...containerStyle
            }}
        >
            <WalletProvider value={walletProviders} >
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
