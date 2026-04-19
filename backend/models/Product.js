const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User"); // Pastikan ini sudah diimpor
const Category = require("./Category");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT, // Menggunakan TEXT karena deskripsi biasanya panjang
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: { model: Category, key: "id" },
    },
    images: {
      type: DataTypes.JSON, // Tipe JSON untuk menyimpan array: ["url1.jpg", "url2.jpg"]
      allowNull: true,
      defaultValue: [],
      validate: {
        // Custom validasi: memastikan array gambar tidak lebih dari 10
        checkLimit(value) {
          if (value && value.length > 10) {
            throw new Error("Maksimal hanya 10 foto yang diizinkan untuk satu produk!");
          }
        },
      },
    },
    rating: {
      type: DataTypes.FLOAT, // FLOAT karena rating bisa berkoma (misal: 4.5)
      defaultValue: 0,
    },
    review_count: {
      type: DataTypes.INTEGER, // Menyimpan jumlah total orang yang memberi ulasan
      defaultValue: 0,
    },
    sold_count: {
      type: DataTypes.INTEGER, // Jumlah terjual
      defaultValue: 0,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE", // Jika user dihapus, produk terkait juga dihapus
    },
    status: {
      type: DataTypes.ENUM("active", "suspended"),
      defaultValue: "active",
    },
  },
  {
    tableName: "products",
    timestamps: true, // Otomatis membuat createdAt dan updatedAt
  },
);

User.hasMany(Product, { foreignKey: "userId", as: "products" });
Category.hasMany(Product, { foreignKey: "categoryId" });
Product.belongsTo(User, { foreignKey: "userId", as: "creator" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

module.exports = Product;
