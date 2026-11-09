import { estado } from "./estado.js";

const celulasMultiplicador = 1000;
const celulasListaVazia = Object.freeze([]);
export const celulasEventoMudou = "celulamudou";

function celulasMontarChave(celulaX, celulaZ) {
    return celulaX * celulasMultiplicador + celulaZ;
}

function celulasChaveX(chave) {
    return Math.floor(chave / celulasMultiplicador);
}

function celulasChaveZ(chave) {
    return chave % celulasMultiplicador;
}

function celulasIguais(celulaA, celulaB) {
    return celulaA.cor === celulaB.cor
        && celulaA.idForma === celulaB.idForma
        && celulaA.idGrupo === celulaB.idGrupo
        && celulaA.ordem === celulaB.ordem;
}

function celulasListasIguais(listaA, listaB) {
    if (listaA.length !== listaB.length) {
        return false;
    }

    for (let i = 0; i < listaA.length; i++) {
        if (!celulasIguais(listaA[i], listaB[i])) {
            return false;
        }
    }

    return true;
}

function celulasPosicaoValida(celulaX, celulaZ, dimensaoX, dimensaoZ) {
    return Number.isInteger(celulaX) && Number.isInteger(celulaZ)
        && celulaX >= 0 && celulaX < dimensaoX
        && celulaZ >= 0 && celulaZ < dimensaoZ;
}

function celulasLerLista(nivelY, chave) {
    const posicoes = estado.camadas.get(nivelY);

    if (posicoes === undefined || !posicoes.has(chave)) {
        return celulasListaVazia;
    }

    return posicoes.get(chave);
}

function celulasGravarLista(nivelY, chave, lista) {
    if (!estado.camadas.has(nivelY)) {
        estado.camadas.set(nivelY, new Map());
    }

    const posicoes = estado.camadas.get(nivelY);

    if (lista.length === 0) {
        posicoes.delete(chave);
    } else {
        posicoes.set(chave, lista);
    }
}

export function celulasAlterar(nivelY, alteracoes) {
    if (estado.projetoAberto === null) {
        return [];
    }

    const dimensaoX = estado.projetoAberto.dimensaoX;
    const dimensaoZ = estado.projetoAberto.dimensaoZ;
    const mudanca = [];

    for (const alteracao of alteracoes) {
        const celulaX = alteracao.celulaX;
        const celulaZ = alteracao.celulaZ;

        if (!celulasPosicaoValida(celulaX, celulaZ, dimensaoX, dimensaoZ)) {
            continue;
        }

        const chave = celulasMontarChave(celulaX, celulaZ);
        const antes = celulasLerLista(nivelY, chave);
        const depois = alteracao.depois;

        if (celulasListasIguais(antes, depois)) {
            continue;
        }

        celulasGravarLista(nivelY, chave, depois);
        mudanca.push({ nivelY, celulaX, celulaZ, antes, depois });
    }

    return mudanca;
}

export function celulasDescartar() {
    estado.camadas.clear();
}

export function celulasPercorrer(nivelY, limites, tratador) {
    const posicoes = estado.camadas.get(nivelY);

    if (posicoes === undefined) {
        return;
    }

    posicoes.forEach((lista, chave) => {
        const celulaX = celulasChaveX(chave);
        const celulaZ = celulasChaveZ(chave);

        if (celulaX < limites.primeiraCelulaX || celulaX >= limites.ultimaCelulaX
            || celulaZ < limites.primeiraCelulaZ || celulaZ >= limites.ultimaCelulaZ) {
            return;
        }

        tratador(celulaX, celulaZ, lista);
    });
}

export function celulasMaiorCamadaY() {
    let maiorCamadaY = 0;

    estado.camadas.forEach((posicoes, nivelY) => {
        if (posicoes.size > 0 && nivelY > maiorCamadaY) {
            maiorCamadaY = nivelY;
        }
    });

    return maiorCamadaY;
}

export function celulasApagarCamadasYVazias() {
    const maiorCamadaY = celulasMaiorCamadaY();

    estado.camadas.forEach((posicoes, nivelY) => {
        if (nivelY > maiorCamadaY) {
            estado.camadas.delete(nivelY);
        }
    });
}

export const celulasCamadaYMaxima = 99;

export function celulasLimiteCamadaY(camadaAtiva) {
    const maiorCamadaY = Math.max(celulasMaiorCamadaY(), 1);
    const camadaYMaxima = Math.max(maiorCamadaY + 1, camadaAtiva);

    return Math.min(camadaYMaxima, celulasCamadaYMaxima);
}