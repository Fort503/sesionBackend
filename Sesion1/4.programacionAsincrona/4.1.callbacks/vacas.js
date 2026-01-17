import cowsay from 'cowsay';

function imprimirVaca(mensaje) {
    console.log(cowsay.say({ text: mensaje }));
}

function vacaUno() {
    imprimirVaca("¡Soy la Vaca 1 y soy veloz!");
}

function vacaDos() {
    console.log("\n(La Vaca 2 está procesando algo muy pesado...)\n");
    const inicio = Date.now();
    while (Date.now() - inicio < 3000) {
        // No hace nada, solo bloquea el procesador por 3 segundos
    }
    imprimirVaca("... soy la Vaca 2 ... tardé 3 segundos ...");
}

function vacaTres() {
    imprimirVaca("¡Soy la Vaca 3 y tuve que esperar a la lenta!");
}

console.log("--- Inicio de la ejecución ---");
vacaUno();
vacaDos();
vacaTres();
console.log("--- Fin de la ejecución ---");
