export {reimport};

async function reimport(path) {
    // returns a new instance of a module by adding a random suffix
    // to its url
    return import('../' + path + '?' + Math.random());
}
