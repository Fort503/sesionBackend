import Cancion from './Cancion.js';

export async function crearCancion(nombre, plataforma) {
    try {
        const resultado = await Cancion.create({ nombre, plataforma });
        return resultado;
    } catch (error) {
        throw error;
    }
}

export async function leerCanciones() {
    try {
        const canciones = await Cancion.findAll();
        return canciones;
    } catch (error) {
        throw error;
    }
}

export async function actualizarCancion(id, nuevoNombre) {
    return await Cancion.update({ nombre: nuevoNombre }, { where: { id: id } });
}

export async function eliminarCancion(id) {
    return await Cancion.destroy({ where: { id: id } });
}