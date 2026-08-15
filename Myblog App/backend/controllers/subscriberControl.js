import Subscriber from "../models/subscriber.js";

export const subscribeUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let subscriber = await Subscriber.findOne({ email: normalizedEmail });

    if (subscriber) {
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        await subscriber.save();
        return res.status(200).json({ message: "Welcome back! Your subscription has been reactivated.", subscriber });
      }
      return res.status(200).json({ message: "You are already subscribed to BlogSphere notifications!", subscriber });
    }

    subscriber = await Subscriber.create({ email: normalizedEmail });

    res.status(201).json({
      message: "🎉 Thank you for subscribing! You will receive email notifications for new posts.",
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
