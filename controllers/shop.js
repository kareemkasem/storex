// imports ...............................................................
const Product = require("../models/product");
const Order = require("../models/order");

const fs = require("fs");
const path = require("path");
const pdfKit = require("pdfkit");
// .......................................................................

const ITEMS_PER_PAGE = 3;

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  let numberOfProducts;

  Product.find()
    .countDocuments({}, (err, productCount) => {
      return productCount;
    })
    .then((productCount) => {
      numberOfProducts = productCount;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE) // skip certain number of documents
        .limit(ITEMS_PER_PAGE); // only get certain number of documents
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNext: ITEMS_PER_PAGE * page < numberOfProducts,
        hasPrevious: page !== 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(numberOfProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      res.status(500).json({ message: "failed to add to cart" });
    });
};

exports.cartDeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      res.status(200).json({ message: "failed" });
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDelteOrder = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findByIdAndDelete(orderId)
    .then((result) => {
      res.status(200).json({ message: "success" });
    })
    .catch((err) => {
      res.status(500).json({ message: "failed" });
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        next(new Error("Order not found"));
      } else if (order.user.userId.toString() !== req.user._id.toString()) {
        next(new Error("unauthorized"));
      } else {
        const invoiceName = `invoice-${orderId}.pdf`;
        const invoicePath = path.join("invoices", invoiceName);

        const pdf = new pdfKit(); //readable stream
        pdf.pipe(fs.createWriteStream(invoicePath)); //stream to fs
        pdf.pipe(res); // stream to client

        pdf.fontSize(28).text("Invoice", { underline: true });
        pdf.text(" ");

        pdf.fontSize(18).fillColor("blue").text("products: ");

        order.products.forEach((prod) => {
          pdf
            .fontSize(15)
            .fillColor("green")
            .text("name: ", { continued: true })
            .fillColor("black")
            .text(prod.product.title);
          pdf
            .fillColor("green")
            .text("amount: ", { continued: true })
            .fillColor("black")
            .text(prod.quantity);
          pdf
            .fillColor("green")
            .text("total: ", { continued: true })
            .fillColor("black")
            .text(prod.quantity * prod.product.price);
          pdf.text(" ");
        });

        pdf.text(" ");
        pdf
          .fontSize(18)
          .fillColor("blue")
          .text("Total cost: ", { continued: true })
          .fillColor("black")
          .text(
            order.products.reduce(
              (acc, curr) => curr.quantity * curr.product.price + acc,
              0
            )
          );

        pdf.end(); // end the streams

        res.setHeader("Content-Type", "application/pdf"); // browser identify it as pdf
        res.setHeader("Content-Disposition", `inline; filename=${invoiceName}`); // browser will open in browser (default) and give it proper name
      }
    })
    .catch((err) => next(err));
};
