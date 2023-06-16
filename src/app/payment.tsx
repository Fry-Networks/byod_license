'use client';
import React, { useEffect } from 'react';
import {
    reconnectProviders,
    initializeProviders,
    WalletProvider,
} from "@txnlab/use-wallet";
import Account from "./components/Account";
import Connect from "./components/Connect";
import Transact from "./components/Transact";

const walletProviders = initializeProviders();

export default function Payment() {

    useEffect(() => {
        reconnectProviders(walletProviders);
    }, []);

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                width: '100vw',
                color: 'white',
                background: 'rgb(28, 28, 28)',
                padding: '20px',
                margin: 'auto',
            }}
        >
            <WalletProvider value={walletProviders} >
                <div style={{ display: 'flex', flexDirection: 'column-reverse', padding: "20px", background: '#84808a', borderRadius: '10px', boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)' }}>
                    <div style={{
                        marginTop: '20px',
                    }}
                    >
                        <Transact />
                    </div>
                    <Connect />

                </div>
            </WalletProvider>

        </div>



    );
}
