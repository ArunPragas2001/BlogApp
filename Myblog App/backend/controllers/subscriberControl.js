import Subscriber from "../models/subscriber.js";
import { sendWelcomeSubscriptionEmail } from "../config/emailService.js";

export const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let subscriber = await Subscriber.findOne({ email: normalizedEmail });
    let isNewSubscription = false;

    if (subscriber) {
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        await subscriber.save();
        isNewSubscription = true;
      } else {
        return res.status(200).json({ message: "You are already subscribed to BlogSphere notifications!", subscriber });
      }
    } else {
      subscriber = await Subscriber.create({ email: normalizedEmail });
      isNewSubscription = true;
    }

    if (isNewSubscription) {
      try {
        await sendWelcomeSubscriptionEmail(normalizedEmail);
        return res.status(201).json({
          message: "Thank you for subscribing! A confirmation email has been sent to your inbox.",
          subscriber
        });
      } catch (emailError) {
        console.error("Subscription welcome email failed:", emailError.message);
        return res.status(201).json({
          message: "You are subscribed, but we could not send the confirmation email right now. Please try again later.",
          subscriber
        });
      }
    }

    res.status(200).json({
      message: "Welcome back! Your subscription has been reactivated.",
      subscriber
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding subscription", error: error.message });
  }
};

export const getSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subscribers", error: error.message });
  }
};
