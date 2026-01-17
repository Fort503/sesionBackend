const LanzarMoneda = new Promise((resolve, reject) => {
    const exito = Math.random() >= 0.5;

    if(exito) {
        resolve("Cara, ganaste")
    } else {
        reject("Cruz, perdiste")
    }
})

LanzarMoneda.then((resultado) => {
    console.log(resultado)
}).catch((error) => {
    console.log(error)
})