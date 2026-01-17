import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { crearCancion, leerCanciones, actualizarCancion, eliminarCancion } from './operaciones.js';

const rl = readline.createInterface({ input, output });

async function mostrarMenu() {
    console.log("\n--- MENU REPRODUCTOR DB ---");
    console.log("1. Ver canciones");
    console.log("2. Agregar cancion");
    console.log("3. Actualizar cancion");
    console.log("4. Eliminar cancion");
    console.log("5. Salir");
    return await rl.question("Selecciona una opcion: ");
}

async function ejecutar() {
    let salir = false;

    while (!salir) {
        const opcion = await mostrarMenu();

        try {
            switch (opcion) {
                case '1':
                    const lista = await leerCanciones();
                    console.table(lista.map(c => c.toJSON ? c.toJSON() : c)); 
                    break;

                case '2':
                    const nombre = await rl.question("Nombre de la cancion: ");
                    const plataforma = await rl.question("Plataforma: ");
                    await crearCancion(nombre, plataforma);
                    console.log("Cancion guardada.");
                    break;

                case '3':
                    const idAct = await rl.question("ID de la cancion a modificar: ");
                    const nuevoNombre = await rl.question("Nuevo nombre: ");
                    await actualizarCancion(idAct, nuevoNombre);
                    console.log("Cancion actualizada.");
                    break;

                case '4':
                    const idElim = await rl.question("ID de la cancion a eliminar: ");
                    await eliminarCancion(idElim);
                    console.log("Cancion eliminada.");
                    break;

                case '5':
                    salir = true;
                    console.log("Cerrando sistema...");
                    break;

                default:
                    console.log("Opcion no valida.");
            }
        } catch (error) {
            console.error("Error:", error.message);
        }
    }

    rl.close();
    process.exit(0);
}

ejecutar();