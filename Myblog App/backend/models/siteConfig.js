import mongoose from "mongoose";

const siteConfigSchema = new mongoose.Schema(
  {
    companyEmail: {
      type: String,
      default: "contact@blogsphere.com"
    },
    companyPhone: {
      type: String,
      default: "+1 (555) 019-2834"
    },
    companyAddress: {
      type: String,
      default: "123 Tech Avenue, Silicon Valley, CA"
    },
    instagramUrl: {
      type: String,
      default: "https://instagram.com"
    },
    facebookUrl: {
      type: String,
      default: "https://facebook.com"
    },
    whatsappNumber: {
      type: String,
      default: "+15550192834"
    },
    termsOfService: {
      type: String,
      default: "Welcome to BlogSphere. By using our platform, you agree to post respectful content and adhere to our terms."
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    blogExpiryDays: {
      type: Number,
      default: 30
    }
  },
  {
    timestamps: true
  }
);

const SiteConfig = mongoose.model("SiteConfig", siteConfigSchema);

export default SiteConfig;
