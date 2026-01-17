import { obtenerConexion } from './conexion.js';

export async function crearCancion(nombre, plataforma) {
    const connection = await obtenerConexion();
    const sql = 'INSERT INTO canciones (nombre, plataforma) VALUES (?, ?)';
    const [result] = await connection.execute(sql, [nombre, plataforma]);
    await connection.end();
    return result;
}

export async function leerCanciones() {
    const connection = await obtenerConexion();
    const [rows] = await connection.execute('SELECT * FROM canciones');
    await connection.end();
    return rows;
}

export async function actualizarCancion(id, nuevoNombre) {
    const connection = await obtenerConexion();
    const sql = 'UPDATE canciones SET nombre = ? WHERE id = ?';
    const [result] = await connection.execute(sql, [nuevoNombre, id]);
    await connection.end();
    return result;
}

export async function eliminarCancion(id) {
    const connection = await obtenerConexion();
    const sql = 'DELETE FROM canciones WHERE id = ?';
    const [result] = await connection.execute(sql, [id]);
    await connection.end();
    return result;
}
