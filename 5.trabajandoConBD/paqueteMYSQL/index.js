import { crearCancion, leerCanciones, eliminarCancion } from './consultas.js';

async function ejecutarPrueba() {
    try {
        //console.log("Insertando cancion...");
        //await crearCancion("One Day", "Spotify");
        await eliminarCancion(6);

        console.log("Listado de canciones:");
        const lista = await leerCanciones();
        console.table(lista);

        // Ejemplo: eliminar la cancion con ID 1
        
    } catch (error) {
        console.error("Error en el CRUD:", error.message);
    }
}

ejecutarPrueba();