import cowsay from 'cowsay';

function imprimirVaca(mensaje) {
    console.log(cowsay.say({ text: mensaje }));
}

function vacaUno() {
    imprimirVaca("Vaca 1: ¡Soy ultra rápida!");
}

function vacaDos() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            imprimirVaca("... soy la Vaca 2 ... procesé en segundo plano ...");
            console.log("Vaca 2 terminó su tarea.");
            resolve();
        }, 3000);
    });
}

function vacaTres() {
    imprimirVaca("Vaca 3: ¡Yo no esperé a nadie!");
}

async function ejecutarPlaylist() {
    console.log("--- Inicio de la ejecución ---");

    vacaUno();
    vacaDos(); 
    vacaTres();

    console.log("--- Fin del script principal ---");
}

ejecutarPlaylist();
console.log("Mensaje de control: El hilo principal sigue libre");