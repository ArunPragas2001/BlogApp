import SiteConfig from "../models/siteConfig.js";

export const getSiteConfig = async (req, res) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) {
      config = await SiteConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Error fetching site settings", error: error.message });
  }
};

export const updateSiteConfig = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Only the Owner can update site settings" });
    }

    let config = await SiteConfig.findOne();
    if (!config) {
      config = new SiteConfig({});
    }

    const {
      companyEmail,
      companyPhone,
      companyAddress,
      instagramUrl,
      facebookUrl,
      whatsappNumber,
      termsOfService
    } = req.body;

    if (companyEmail !== undefined) config.companyEmail = companyEmail;
    if (companyPhone !== undefined) config.companyPhone = companyPhone;
    if (companyAddress !== undefined) config.companyAddress = companyAddress;
    if (instagramUrl !== undefined) config.instagramUrl = instagramUrl;
    if (facebookUrl !== undefined) config.facebookUrl = facebookUrl;
    if (whatsappNumber !== undefined) config.whatsappNumber = whatsappNumber;
    if (termsOfService !== undefined) config.termsOfService = termsOfService;

    const updatedConfig = await config.save();
    res.json(updatedConfig);
  } catch (error) {
    res.status(500).json({ message: "Error updating site settings", error: error.message });
  }
};
