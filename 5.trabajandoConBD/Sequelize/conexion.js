import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('db_ejemplo', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false 
});

export async function probarConexion() {
    try {
        await sequelize.authenticate();
        console.log("Conexion establecida correctamente con Sequelize.");
        return sequelize;
    } catch (error) {
        console.error("Error al conectar con Sequelize:", error.message);
        throw error;
    }
}

export default sequelize;