/* jshint esversion: 6 */
const Product=require("../models/product.model")
const Image = require("../models/image.model");
const excel = require('exceljs');
const fs = require('fs');
const sharp = require('sharp');
const path = require("path");
const println = require("./../utils/println");
const upload = require("../utils/uploadFile");


exports.uploadProductImage = async (req, res) => {
  // TODO: controle inputs
  try {
    req.file.filename = `product-${req.file.originalname.replace(/\s/g, '')}-${Date.now()}.jpeg`;
    const filePath = `public/images/${req.file.filename}`;

    const sharpedImage = await sharp(req.file.buffer)
    .resize(150, 150)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(filePath);
    console.log(sharpedImage)
    const { size, format } = sharpedImage;
    const filename = req.file.filename;
    
    // Create a new instance of the image
    const newImage = new Image({
      filename,
      path: filePath,
      contentType: format,
      size,
      published: req.body.published,
    });

    // Save the image to the image collection
    const savedImage = await newImage.save();

    // Create a new instance of the product
    const newProduct = new Product({
      titles: req.body.titles,
      description: req.body.description,
      price: req.body.price,
      quantityStock: req.body.quantityStock,
      categories: req.body.categories,
      rating: req.body.rating,
      published: req.body.published,
      images: [savedImage._id], // Associate the image with the product
    });

    // Save the product to the product collection
    const savedProduct = await newProduct.save();

    // Send the response
    res.status(200).send({
      productId: savedProduct._id,
      imagePath: savedImage.path,
      message: 'Le produit a été enregistré avec succès avec son image.',
    });
  } catch (error) {
    console.error('Error while uploading product image:', error);
    res.status(500).send({
      message: 'Une erreur s\'est produite lors de l\'enregistrement du produit avec son image.',
    });
  }
};

// Récupérer une image spécifique par son ID
exports.getImageById = (req, res) => {
  const imageId = req.params.imageId;

  Image.findById(imageId)
    .then(image => {
      if (!image) {
        return res.status(404).send({ message: "Image not found." });
      }

      const imagePath = path.join(__dirname, "../public", image.path);

      // Lire les données binaires de l'image
      fs.readFile(imagePath, (err, data) => {
        if (err) {
          return res.status(500).send({
            message: "Error retrieving image with ID " + imageId
          });
        }

        // Envoyer les données binaires de l'image en tant que réponse HTTP
        res.send(data);
      });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving image with ID " + imageId
      });
    });
};



// Exporter la fonction pour récupérer l'image du produit par nom
exports.getProductImageByName = async (req, res, next) => {
  const imageName = `${req.params.name}.jpeg`;

  try {
    const image = await Image.findOne({ filename: imageName });
    if (!image) {
      return res.status(404).json({
        status: "fail",
        message: "Image not found",
      });
    }

    res.sendFile(image.path);
  } catch (error) {
    return next(error);
  }
};

// Exporter la fonction pour récupérer l'image du produit par ID
exports.getProductImageById = async (req, res, next) => {
  const imageId = req.params.id;

  try {
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        status: "fail",
        message: "Image not found",
      });
    }

    res.sendFile(image.path);
  } catch (error) {
    return next(error);
  }
};
// Retrieve all products
/*exports.getAllProducts = (req, res) => {
  Product.find()
    .populate("images") // Ajoutez cette ligne pour peupler les images associées aux produits
    .then(products => {
      // Modifiez chaque produit pour inclure le chemin de l'image
      const productsWithImageUrls = products.map(product => {
        const imageUrl = product.images.length > 0 ? product.images[0].path : null;
        return {
          ...product._doc,
          imageUrl
        };
      });

      res.send(productsWithImageUrls);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving products."
      });
    });
};*/
exports.getAllProducts = (req, res) => {
  Product.find()
    .populate("categories", "titles") // Inclure les détails de la catégorie (seulement le titre)
    .populate("images") // Peupler les images associées aux produits
    .then(products => {
      const productsWithImageUrlsAndCategory = products.map(product => {
        const imageUrl = product.images.length > 0 ? product.images[0].path : null;
        const categoryTitle = product.category ? product.category.title : null;
        return {
          ...product._doc,
          imageUrl,
          categoryTitle
        };
      });

      res.send(productsWithImageUrlsAndCategory);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving products."
      });
    });
};

/*
// Retrieve a single product by ID
exports.getProductById = (req, res) => {
  const productId = req.params.id;

  Product.findById(productId)
    .populate("categories", "titles") // Inclure les détails de la catégorie (seulement les titres)
    .then(product => {
      if (!product) {
        return res.status(404).send({
          message: "Product not found with id: " + productId
        });
      }

      // Récupérer les titres de la catégorie
      const categoryTitles = product.categories.map(category => category.titles);

      // Envoyer la réponse avec les titres de la catégorie
      res.send({
        product,
        categoryTitles
      });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error retrieving product with id: " + productId
      });
    });
};*/
// Retrieve a single product by ID
// Retrieve a single product by ID
exports.getProductById = (req, res) => {
  const productId = req.params.id;

  Product.findById(productId)
    .populate("categories") // Inclure tous les détails de la catégorie
    .then(product => {
      if (!product) {
        return res.status(404).send({
          message: "Product not found with id: " + productId
        });
      }

      // Récupérer les titres des catégories
      const categoryTitles = product.categories.map(category => category.titles);

      // Mettre à jour le produit avec les titres des catégories
      product.categoryTitle = categoryTitles;

      // Envoyer la réponse avec le produit mis à jour
      res.send(product);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error retrieving product with id: " + productId
      });
    });
};



// Update a product by ID
exports.updateProduct = (req, res) => {
  const productId = req.params.id;

  Product.findByIdAndUpdate(productId, req.body, { new: true })
    .then(product => {
      if (!product) {
        return res.status(404).send({
          message: "Product not found with id: " + productId
        });
      }
      res.send(product);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error updating product with id: " + productId
      });
    });
};


// Delete a product by ID
exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  Product.findByIdAndRemove(productId)
    .then(product => {
      if (!product) {
        return res.status(404).send({
          message: "Product not found with id: " + productId
        });
      }
      res.send({ message: "Product deleted successfully!" });
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Error deleting product with id: " + productId
      });
    });
};

exports.searchInput = (req, res) => {
  const searchTerm = req.params.term; // Récupérer le terme de recherche depuis les paramètres de la requête

  // Utiliser une expression régulière pour effectuer une recherche insensible à la casse
  const regex = new RegExp(searchTerm, "i");

  // Utiliser la méthode find du modèle Product pour rechercher les produits correspondants
  Product.find({ $or: [{ titles: regex }, { description: regex }] })
    .then(products => {
      res.send(products);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Une erreur s'est produite lors de la recherche des produits.",
      });
    });
};
//Ajouter une image à un produit
exports.addImageToProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send({ message: "Le produit n'a pas été trouvé." });
    }
    // Créer une nouvelle image
    const image = new Image({
      filename: req.body.filename,
      path: req.body.path,
      contentType: req.body.contentType,
      size: req.body.size,
      published: req.body.published ? req.body.published : false,
      rating: req.body.rating
    });
    // Enregistrer l'image dans la base de données
    await image.save();

    // Ajouter l'image au produit
    product.images.push(image);
    await product.save();

    res.status(200).send({ message: "L'image a été ajoutée au produit avec succès." });
  } catch (error) {
    res.status(500).send({ message: "Une erreur s'est produite lors de l'ajout de l'image au produit." });
  }
};


// Tri des produits par createdAt
exports.getProductsSortedByCreatedAt = (req, res) => {
  Product.find()
    .sort({ createdAt: -1 }) // Tri ascendant par createdAt (1 pour ascendant, -1 pour descendant)
    .then(products => {
      res.send(products);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Une erreur s'est produite lors de la récupération des produits triés par createdAt."
      });
    });
};
//Les 5 derniers produits ajoutés
exports.getRecentProducts = (req, res) => {
  Product.find()
    .sort({ createdAt: -1 }) // Tri par ordre décroissant de "createdAt"
    .limit(5) // Limite le nombre de résultats à 5
    .exec((err, products) => {
      if (err) {
        res.status(500).send({
          message: err.message || "Une erreur s'est produite lors de la récupération des produits."
        });
      } else {
        res.send(products);
      }
    });
};
//Afficher les produits par categories
exports.getProductsByCategory = (req, res) => {
  const categoryId = req.params.categoryId;

  Product.find({ category: categoryId })
    .populate("category","titles") // Si vous souhaitez également inclure les détails de la catégorie dans la réponse
    .then(products => {
      res.send(products);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Une erreur s'est produite lors de la récupération des produits par catégorie."
      });
    });
};
//filtre multicritère par prix et par catégorie

exports.getFilteredProducts = (req, res) => {
  const { category, minPrice, maxPrice } = req.query;

  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (minPrice && maxPrice) {
    filter.price = { $gte: minPrice, $lte: maxPrice };
  } else if (minPrice) {
    filter.price = { $gte: minPrice };
  } else if (maxPrice) {
    filter.price = { $lte: maxPrice };
  }

  Product.find(filter)
    .populate("categories")
    .then(products => {
      res.send(products);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Une erreur s'est produite lors de la récupération des produits avec le filtre multicritère."
      });
    });
};
// Recommandation des produits de la même catégorie lors de l'affichage d'un produit
exports.getProductSimilaire = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Récupérer le produit demandé
    const prod = await Product.findById(productId).populate('categories');

    if (!prod) {
      return res.status(404).json({ message: 'Produit non trouvé.' });
    }

    // Extraire la catégorie du produit
    const categoryId = prod.categories[0]._id;

    // Trouver d'autres produits de la même catégorie
    const similarProducts = await Product.find({
      categories: categoryId,
      _id: { $ne: productId } // Exclure le produit actuel
    }).limit(5).populate('categories'); // Limiter le nombre de produits similaires à afficher et peupler les données de catégorie

    res.status(200).json({
      prod: prod,
      similarProducts: similarProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération du produit.' });
  }
};/* 
// Statistique des produits ajoutés par mois
exports.getProductStatsByMonth = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // Grouper par mois de création
          products: {
            $push: {
              title: "$titles",
              quantityStock: "$quantityStock"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                months: [
                  "",
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "Décember"
                ]
              },
              in: {
                $arrayElemAt: ["$$months", "$_id"]
              }
            }
          },
          products: 1
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la récupération des statistiques des produits." });
  }
};
 */
// Statistique des produits ajoutés par mois
exports.getProductStatsByMonth = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" }, // Grouper par mois de création
          count: { $sum: 1 } // Compter le nombre de produits par mois de création
        }
      },
      {
        $project: {
          _id: 0,
          month: {
            $let: {
              vars: {
                months: [
                  "",
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December"
                ]
              },
              in: {
                $arrayElemAt: ["$$months", "$_id"]
              }
            }
          },
          count: 1
        }
      },
      {
        $sort: {
          month: 1 // Trier par ordre croissant des mois
        }
      }
    ]);

    // Préparer les données pour le graphique
    const labels = stats.map((stat) => stat.month);
    const values = stats.map((stat) => stat.count);

    res.status(200).json({ labels, values });
  } catch (error) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la récupération des statistiques des produits." });
  }
};

//Statistique Nombre de produits par catégorie
exports.getProductCountByCategory = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: "$categories", // Grouper par catégorie
          count: { $sum: 1 } // Compter le nombre de produits par catégorie
        }
      },
      {
        $lookup: {
          from: "categories", // Nom de la collection des catégories
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      {
        $project: {
          _id: 0,
          category: {
            $arrayElemAt: ["$category.titles", 0] // Récupérer le titles de la catégorie
          },
          count: 1
        }
      }
    ]);

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la récupération des statistiques des produits par catégorie." });
  }
};
//Rating par produit
exports.updateProductRating = async (req, res) => {
  const productId = req.params.productId;
  const { rating } = req.body;

  try {
    // Vérifier si le produit existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send({ message: "Produit introuvable." });
    }

    // Mettre à jour la note du produit
    product.rating = rating;

    // Enregistrer les modifications
    await product.save();

    res.status(200).send({
      productId: product._id,
      rating: product.rating,
      message: "La note du produit a été mise à jour avec succès."
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la note du produit :", error);
    res.status(500).send({
      message: "Une erreur s'est produite lors de la mise à jour de la note du produit."
    });
  }
};


//Pareto des rating par produit
exports.getParetoRatings = async (req, res) => {
  try {
    const paretoRatings = await Product.aggregate([
      {
        $group: {
          _id: { id: "$_id", title: "$titles" }, // Grouper par ID de produit et titre de produit
          count: { $sum: 1 }, // Compter le nombre de produits par ID de produit et titre de produit
          ratings: { $sum: "$rating" } // Somme des ratings par ID de produit et titre de produit
        }
      },
      {
        $sort: {
          ratings: -1 // Trier par ordre décroissant des rating
        }
      }
    ]);

    // Préparer les données pour le graphique
    const labels = paretoRatings.map((rating) => rating._id.title);
    const values = paretoRatings.map((rating) => rating.ratings);

    res.status(200).json({ labels, values });
  } catch (error) {
    res.status(500).json({ message: "Une erreur s'est produite lors de la récupération du Pareto des ratings des produits." });
  }
};


exports.exportProductsToExcel = async (req, res) => {
  try {
    // Récupérer les produits à exporter
    const products = await Product.find().populate('images');

    // Créer un nouveau classeur Excel
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Produits');

    // Définir les en-têtes de colonne
    worksheet.columns = [
      { header: 'Titre', key: 'titles', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Prix', key: 'price', width: 10 },
      { header: 'Quantité en stock', key: 'quantityStock', width: 15 },
      { header: 'Publié', key: 'published', width: 10 },
      { header: 'Image', key: 'image', width: 30 },
    ];

    // Ajouter les données des produits
    products.forEach((product) => {
      const imageUrls = product.images.map((image) => image.url).join(', ');
      worksheet.addRow([
        product.titles,
        product.description,
        product.price,
        product.quantityStock,
        product.published ? 'Oui' : 'Non',
        imageUrls,
      ]);
    });

    // Générer les données binaires du fichier Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Définir les en-têtes de la réponse HTTP pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');

    // Envoyer les données binaires du fichier Excel dans la réponse HTTP
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Une erreur s\'est produite lors de l\'exportation des produits.' });
  }
};
/*
exports.exportProductsToExcel = async (req, res) => {
  try {
    // Récupérer les produits à exporter
    const products = await Product.find().populate('images');

    // Créer un nouveau classeur Excel
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Produits');

    // Définir les en-têtes de colonne
    worksheet.columns = [
      { header: 'Titre', key: 'titles', width: 20 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Prix', key: 'price', width: 10 },
      { header: 'Quantité en stock', key: 'quantityStock', width: 15 },
      { header: 'Publié', key: 'published', width: 10 },
      { header: 'Image', key: 'image', width: 30 },
    ];

    // Ajouter les données des produits
    products.forEach((product) => {
      const imageUrls = product.images.map((image) => image.url);

      // Ajouter les données des produits
      worksheet.addRow([
        product.titles,
        product.description,
        product.price,
        product.quantityStock,
        product.published ? 'Oui' : 'Non',
        { text: 'Voir l\'image', hyperlink: imageUrls[0] } // Ajouter l'hyperlien de l'image
      ]);

      // Récupérer le numéro de la dernière ligne ajoutée
      const lastRowNumber = worksheet.lastRow.number;

      // Ajouter l'image à la feuille de calcul
      worksheet.addImage({
        filename: imageUrls[0], // Utilisez le nom de fichier de l'image
        extension: 'jpeg',
        hyperlinks: [{
          ref: `F${lastRowNumber}`, // Référence de la cellule contenant l'hyperlien
          hyperlink: imageUrls[0], // URL de l'image
        }],
        tl: { col: 5, row: lastRowNumber }, // Position de l'image (colonne 5, ligne de la dernière ligne ajoutée)
        br: { colOff: 80, rowOff: 80 }, // Taille de l'image
      });
    });

    // Générer les données binaires du fichier Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Définir les en-têtes de la réponse HTTP pour le téléchargement
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=produits.xlsx');

    // Envoyer les données binaires du fichier Excel dans la réponse HTTP
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: "Une erreur s'est produite lors de l'exportation des produits." });
  }
};
*/