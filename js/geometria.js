function geometriaAjustarVertices(vertices) {
    const menorU = Math.min(...vertices.map(vertice => vertice.u));
    const maiorU = Math.max(...vertices.map(vertice => vertice.u));
    const menorV = Math.min(...vertices.map(vertice => vertice.v));
    const maiorV = Math.max(...vertices.map(vertice => vertice.v));

    const centroU = (menorU + maiorU) / 2;
    const centroV = (menorV + maiorV) / 2;
    const metadeU = (maiorU - menorU) / 2;
    const metadeV = (maiorV - menorV) / 2;

    return vertices.map(vertice => ({
        u: (vertice.u - centroU) / metadeU,
        v: (vertice.v - centroV) / metadeV
    }));
}

function geometriaPreparar(forma) {
    const angulo = forma.rotacao * Math.PI / 180;
    const vertices = [];

    if (forma.tipo === "poligono") {
        const verticesBrutos = [];

        for (let i = 0; i < forma.lados; i++) {
            const anguloVertice = Math.PI / 2 - Math.PI / forma.lados + 2 * Math.PI * i / forma.lados;

            verticesBrutos.push({ u: Math.cos(anguloVertice), v: Math.sin(anguloVertice) });
        }

        vertices.push(...geometriaAjustarVertices(verticesBrutos));
    }

    return {
        tipo: forma.tipo,
        expoente: forma.expoente,
        centroX: forma.posicaoX + forma.dimensaoX / 2,
        centroZ: forma.posicaoZ + forma.dimensaoZ / 2,
        meioX: forma.dimensaoX / 2,
        meioZ: forma.dimensaoZ / 2,
        cosseno: Math.cos(angulo),
        seno: Math.sin(angulo),
        vertices: vertices
    };
}

function geometriaDentroPreparada(preparada, celulaX, celulaZ) {
    const deltaX = (celulaX + 0.5) - preparada.centroX;
    const deltaZ = (celulaZ + 0.5) - preparada.centroZ;

    const localX = deltaX * preparada.cosseno + deltaZ * preparada.seno;
    const localZ = -deltaX * preparada.seno + deltaZ * preparada.cosseno;

    const u = localX / preparada.meioX;
    const v = localZ / preparada.meioZ;

    if (preparada.tipo === "superelipse") {
        return Math.abs(u) ** preparada.expoente + Math.abs(v) ** preparada.expoente <= 1 + 1e-9;
    }

    for (let i = 0; i < preparada.vertices.length; i++) {
        const verticeAtual = preparada.vertices[i];
        const verticeSeguinte = preparada.vertices[(i + 1) % preparada.vertices.length];

        const produto = (verticeSeguinte.u - verticeAtual.u) * (v - verticeAtual.v) - (verticeSeguinte.v - verticeAtual.v) * (u - verticeAtual.u);

        if (produto < -1e-9) {
            return false;
        }
    }

    return true;
}

function geometriaLimitePreparada(preparada, celulaX, celulaZ) {
    if (!geometriaDentroPreparada(preparada, celulaX, celulaZ)) {
        return false;
    }

    return !geometriaDentroPreparada(preparada, celulaX, celulaZ - 1)
        || !geometriaDentroPreparada(preparada, celulaX, celulaZ + 1)
        || !geometriaDentroPreparada(preparada, celulaX - 1, celulaZ)
        || !geometriaDentroPreparada(preparada, celulaX + 1, celulaZ);
}

export function geometriaDentro(forma, celulaX, celulaZ) {
    const preparada = geometriaPreparar(forma);

    return geometriaDentroPreparada(preparada, celulaX, celulaZ);
}

export function geometriaLimite(forma, celulaX, celulaZ) {
    const preparada = geometriaPreparar(forma);

    return geometriaLimitePreparada(preparada, celulaX, celulaZ);
}

export function geometriaRasterizar(forma) {
    const preparada = geometriaPreparar(forma);
    const testar = forma.estilo === "contorno" ? geometriaLimitePreparada : geometriaDentroPreparada;
    const raio = Math.ceil(Math.hypot(forma.dimensaoX, forma.dimensaoZ) / 2) + 1;
    const primeiraCelulaX = Math.floor(preparada.centroX - raio);
    const ultimaCelulaX = Math.ceil(preparada.centroX + raio);
    const primeiraCelulaZ = Math.floor(preparada.centroZ - raio);
    const ultimaCelulaZ = Math.ceil(preparada.centroZ + raio);
    const posicoes = [];

    for (let celulaX = primeiraCelulaX; celulaX < ultimaCelulaX; celulaX++) {
        for (let celulaZ = primeiraCelulaZ; celulaZ < ultimaCelulaZ; celulaZ++) {
            if (testar(preparada, celulaX, celulaZ)) {
                posicoes.push({ celulaX: celulaX, celulaZ: celulaZ });
            }
        }
    }

    return posicoes;
}