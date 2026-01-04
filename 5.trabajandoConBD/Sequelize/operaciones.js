import Cancion from './modelo.js';

export async function crearCancion(nombre, plataforma) {
    const result = await Cancion.create({ nombre, plataforma });
    return result;
}

export async function leerCanciones() {
    const rows = await Cancion.findAll();
    return rows;
}

export async function actualizarCancion(id, nuevoNombre) {
    const result = await Cancion.update(
        { nombre: nuevoNombre },
        { where: { id: id } }
    );
    return result;
}

export async function eliminarCancion(id) {
    const result = await Cancion.destroy({
        where: { id: id }
    });
    return result;
}