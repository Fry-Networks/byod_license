'use server'
import { Stripe } from 'stripe';
import { createUser, getUser, setUser } from './LicenseProcessor';
require('dotenv').config();
console.log(process.env.STRIPE_SECRET_KEY);
const client = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2022-11-15',
});

export async function handleToken(email: string) {
    try {
        const paymentIntent = await client.paymentIntents.create({
            amount: 5250,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Payment for FRY',
            metadata: {productId: 'prod_O7M3lpEZaAUdE8', email: email},
        });

        console.log(paymentIntent);
        if (paymentIntent.status === 'requires_payment_method') {
            console.log('Payment intent created');
            return paymentIntent.client_secret;
        } else {
            console.log('Payment failed');
        }
    } catch (error) {
        console.log('Error creating payment intent:', error);
    }
}

export async function createPaymentIntent(email: string) {
    const clientSecret = await handleToken(email);
    return clientSecret;
}





