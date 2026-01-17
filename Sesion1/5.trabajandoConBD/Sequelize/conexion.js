import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('db_ejemplo', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

export async function obtenerConexion() {
    try {
        await sequelize.authenticate();
        console.log("Conexion establecida correctamente.");
        return sequelize;
    } catch (error) {
        console.error("Error al obtener la conexion:", error.message);
        throw error;
    }
}

obtenerConexion();

export default sequelize;