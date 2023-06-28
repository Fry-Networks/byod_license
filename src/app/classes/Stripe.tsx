'use server'
import { Stripe } from 'stripe';
require('dotenv').config();
const secret_key = process.env.NODE_ENV === 'production' ? process.env.STRIPE_SECRET_KEY : process.env.STRIPE_SECRET_KEY_TEST;
const client = new Stripe(secret_key!, {
    apiVersion: '2022-11-15',
});

export async function handleToken(email: string) {
    try {
        const paymentIntent = await client.paymentIntents.create({
            amount: 5250,
            currency: 'usd',
            payment_method_types: ['card'],
            description: 'Payment for FRY',
            metadata: {productId: 'prod_O72WxsaqNDJFTi', email: email},
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





