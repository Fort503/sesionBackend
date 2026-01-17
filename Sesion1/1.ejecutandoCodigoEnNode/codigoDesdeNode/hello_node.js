const art = [
    "  _    _      _ _        __          __        _     _ ",
    " | |  | |    | | |       \\ \\        / /       | |   | |",
    " | |__| | ___| | | ___    \\ \\  /\\  / /__  _ __| | __| |",
    " |  __  |/ _ \\ | |/ _ \\    \\ \\/  \\/ / _ \\| '__| |/ _` |",
    " | |  | |  __/ | | (_) |    \\  /\\  / (_) | |  | | (_| |",
    " |_|  |_|\\___|_|_|\\___/      \\/  \\/ \\___/|_|  |_|\\__,_|",
    "                                                       "
];

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.clear();
    
    console.log(`${colors.bright}${colors.cyan}>>> Iniciando script de Node.js...${colors.reset}\n`);
    await sleep(600);

    const palette = [colors.blue, colors.cyan, colors.green, colors.yellow, colors.magenta, colors.red];

    for (let i = 0; i < art.length; i++) {
        const color = palette[i % palette.length];
        console.log(`${color}${art[i]}${colors.reset}`);
        await sleep(150);
    }

    console.log(`\n${colors.bright}Información del entorno:${colors.reset}`);
    console.log(` ${colors.green}✔${colors.reset} Versión de Node: ${colors.yellow}${process.version}${colors.reset}`);
    console.log(` ${colors.green}✔${colors.reset} Sistema Operativo: ${colors.yellow}${process.platform}${colors.reset}`);
    console.log(` ${colors.green}✔${colors.reset} Arquitectura: ${colors.yellow}${process.arch}${colors.reset}`);
    console.log(`\n${colors.magenta}¡Hola Mundo desde el Backend!${colors.reset}\n`);
}

main();