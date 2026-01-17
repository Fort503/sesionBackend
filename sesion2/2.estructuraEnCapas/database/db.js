require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelizeInstance = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
});


const testConnection = async () => {
  try {
    await sequelizeInstance.authenticate();
    console.log('Conexión a la base de datos exitosa');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
};

testConnection();

module.exports = { sequelizeInstance, DataTypes };