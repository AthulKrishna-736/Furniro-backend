import bannerModel from "../../models/bannerSchema.js";

// Get banners
export const getBanners = async (req, res, next) => {
  const banners = await bannerModel.find().sort({ createdAt: 1 }).catch((error) => {
    return next({ statusCode: 500, message: "Failed to retrieve banners", error: error.message });
  });

  res.status(200).json({
    message: "Banners retrieved successfully",
    banner: banners,
  });
};

// Add banners
export const addBanners = async (req, res, next) => {
  const { bannerLocation, image } = req.body;

  if (!bannerLocation || !image) {
    return next({ statusCode: 400, message: 'Banner location and image are missing.' });
  }


  const banner = new bannerModel({
    bannerLocation: bannerLocation,
    image: image,
  });

  await banner.save().catch((error) => {
    return next({ statusCode: 500, message: 'Banner adding failed. Please try again' });
  });

  res.status(201).json({ message: 'Banner added successfully' });
};

// Edit banners
export const editBanner = async (req, res, next) => {
  const { id } = req.params;
  const { image, bannerLocation } = req.body;

  if (!id || !image || !bannerLocation) {
    return next({ statusCode: 400, message: 'Banner ID, location, and image are required.' });
  }

  const updatedBanner = await bannerModel.findByIdAndUpdate(
    id,
    { image: image, bannerLocation: bannerLocation },
    { new: true }
  ).catch((error) => {
    return next({ statusCode: 500, message: 'Failed to update the banner image. Please try again.' });
  });

  if (!updatedBanner) {
    return next({ statusCode: 404, message: 'Banner not found.' });
  }

  res.status(200).json({ message: 'Banner image updated successfully.' });
};
