const upload = require("../utils/uploadFile");
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const AppError = require("./../utils/appError");
const println = require("./../utils/println");
const Product = require("./../models/product.model");
const Image = require("./../models/image.model");

// Upload image using the photo parameter
const uploadProductImage = upload.single("image");

// Resizing product photo using the sharp package
const resizePhoto = async (req, res, next) => {
  try {
    if (!req.file || !req.body.product_id) {
      println({ service: "uploadFile", level: "error", message: "Invalid request parameters (file or product_id)" });
      return next(new AppError("Please provide valid parameters!", 400));
    }

    const product = await Product.findById(req.body.product_id);
    if (!product) {
      println({ service: "uploadFile", level: "error", message: "Product not found with the provided ID" });
      return next(new AppError("Product not found!", 404));
    }

    req.file.filename = `image-${req.body.product_id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      //.resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/images/${req.file.filename}`);

    // Create a new instance of the image
    const newImage = new Image({
      filename: req.file.filename,
      path: `public/images/${req.file.filename}`,
      contentType: req.file.mimetype,
      size: req.file.size,
      published: true,
    });

    // Save the image to the image collection
    const savedImage = await newImage.save();

    // Associate the image with the product
    product.images.push(savedImage._id);

    // Save the updated product
    await product.save();

    println({ service: "uploadFile", level: "info", message: "Image has been uploaded and associated with the product" });

    res.status(201).json({
      status: "success",
      data: {
        product,
        image: savedImage,
      },
    });
  } catch (error) {
    println({ service: "uploadFile", level: "error", message: "Error while uploading and associating the image with the product" });
    return next(new AppError("Failed to upload and associate the image with the product", 400));
  }
};

module.exports = {
  uploadProductImage,
  resizePhoto,
};
