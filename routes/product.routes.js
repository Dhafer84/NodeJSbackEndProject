const { authJwt } = require("../middlewares");
const controller = require("../controllers/product.controller");
const upload = require("../utils/uploadFile");
const path = require("path");
const express = require("express");


module.exports = function (app) {
  // il faut la mettre pour chaque route (access)
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });



  // Récupérer tous les produits
  app.get("/api/products", [authJwt.verifyToken], controller.getAllProducts);

  // Récupérer les produits par catégorie
  app.get("/api/category/:categoryId/products", [authJwt.verifyToken], controller.getProductsByCategory);

  // Récupérer un produit par son ID
  app.get("/api/product/:id", [authJwt.verifyToken], controller.getProductById);

  // Mettre à jour un produit
  app.put("/api/product/:id", [authJwt.verifyToken], controller.updateProduct);

  // Supprimer un produit
  app.delete("/api/product/:id", [authJwt.verifyToken], controller.deleteProduct);

  //Chercher un produit
  app.get("/api/product/search/:term", [authJwt.verifyToken], controller.searchInput);


  //Ajouter image à un produit
  app.post("/api/product/:productId/images", [authJwt.verifyToken], controller.addImageToProduct);


  // Tri de plus nouveaux vers l'ancien
  app.get("/api/products/sorted-by-createdat", [authJwt.verifyToken], controller.getProductsSortedByCreatedAt);

  // Afficher les 5 derniers produits ajoutés
  app.get("/api/products/recent", [authJwt.verifyToken], controller.getRecentProducts);

  //Afficher les produits par categories
  app.get("/category/:categoryId", [authJwt.verifyToken], controller.getProductsByCategory);

  //filtre multicritère par prix et par catégorie
  app.get("/filter", [authJwt.verifyToken], controller.getFilteredProducts);

  //Recommandation des produits de la même catégories
  app.get('/api/prod/:productId', [authJwt.verifyToken], controller.getProductSimilaire);

  // Statistique des produits ajoutés par mois
  app.get('/api/product/stats/month', [authJwt.verifyToken], controller.getProductStatsByMonth);

  //Statistique Nombre de produits par catégorie
  app.get('/api/product/stats/category', [authJwt.verifyToken], controller.getProductCountByCategory);

  //Pareto des rating par produit
  app.get("/pareto-ratings", [authJwt.verifyToken], controller.getParetoRatings);

  //Créer un nouveau produit
  app.post("/api/products/upload-image", upload.single("image"), controller.uploadProductImage);

  //export Excel
  app.get('/export-to-excel', [authJwt.verifyToken], controller.exportProductsToExcel);





};
