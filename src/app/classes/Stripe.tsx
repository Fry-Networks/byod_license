import { Stripe } from 'stripe';
require('dotenv').config();

export class StripeService {
  private stripe: Stripe;

  constructor() {
    console.log('hey')
    console.log(process.env.STRIPE_SECRET_KEY);
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2022-11-15',
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'usd') {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount, // this is in the smallest currency unit (e.g., cents for usd)
        currency,
      });

      // return only what's needed for the frontend
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      throw error;
    }
  }

  // Add other methods needed to handle payments
}
