import mysql from 'mysql2/promise';

const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_ejemplo'
};

export async function obtenerConexion() {
    try {
        const connection = await mysql.createConnection(config);
        console.log("Conexion establecida correctamente.");
        return connection;
    } catch (error) {
        console.error("Error al obtener la conexion:", error.message);
        throw error;
    }
}