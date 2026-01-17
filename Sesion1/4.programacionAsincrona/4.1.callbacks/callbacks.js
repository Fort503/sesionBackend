function saludar(nombre, callback) {
    callback(nombre)
}

function saludarCordialmente(nombre) {
    setTimeout(() => {
        console.log("Un saludo cordial señor " + nombre)
    }, 2000)
}

function saludarComogente(nombre) {
    console.log(`Hola, ${nombre}, ¿cómo va todo?`);
}

saludar("pepe cuenca", saludarCordialmente) 
saludar("pepe cuenca", saludarComogente)