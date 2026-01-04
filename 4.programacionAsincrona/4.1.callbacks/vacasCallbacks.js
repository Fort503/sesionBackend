import cowsay from 'cowsay';

function imprimirVaca(mensaje) {
    console.log(cowsay.say({ text: mensaje }));
}

function vacaUno() {
    imprimirVaca("Vaca 1: ¡Soy ultra rápida!");
}

function vacaDos() {
    setTimeout(() => {
        imprimirVaca("... soy la Vaca 2 ... procesé en segundo plano ...");
        console.log("Vaca 2 terminó su tarea.");
    }, 3000);
}

function vacaTres() {
    imprimirVaca("Vaca 3: ¡Yo no esperé a nadie!");
}

console.log("--- Inicio de la ejecución (Asíncrona con Callbacks) ---");
vacaUno();
vacaDos();
vacaTres();
console.log("--- Fin del script principal ---");