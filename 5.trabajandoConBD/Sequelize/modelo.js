import { DataTypes } from 'sequelize';
import sequelize from './conexion.js';

const Cancion = sequelize.define('Cancion', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'canciones',
    timestamps: false 
});

export default Cancion;