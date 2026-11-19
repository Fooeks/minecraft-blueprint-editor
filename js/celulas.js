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

export function celulasListasIguais(listaA, listaB) {
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

export function celulasObter(nivelY, celulaX, celulaZ) {
    const chave = celulasMontarChave(celulaX, celulaZ);

    return celulasLerLista(nivelY, chave);
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

export function celulasBloqueada(celula) {
    if (celula.idForma === null) {
        return false;
    }

    return estado.formas.get(celula.idForma)?.bloqueado === true;
}

export function celulasListaInserir(lista, celula, listaSimples) {
    const bloqueadas = lista.filter(celulasBloqueada);

    if (bloqueadas.length === 0) {
        return listaSimples;
    }

    const resultado = [];

    for (const bloqueada of bloqueadas) {
        resultado.push(Object.freeze({ ...bloqueada, ordem: resultado.length }));
    }

    resultado.push(Object.freeze({ ...celula, ordem: resultado.length }));

    return Object.freeze(resultado);
}

export function celulasListaSoltar(lista, idForma) {
    let mudou = false;
    const resultado = [];

    for (const celula of lista) {
        if (celula.idForma === idForma) {
            resultado.push(Object.freeze({ ...celula, idForma: null }));
            mudou = true;
        } else {
            resultado.push(celula);
        }
    }

    if (!mudou) {
        return lista;
    }

    return Object.freeze(resultado);
}

export function celulasListaRemover(lista, idForma) {
    let removeu = false;
    const resultado = [];

    for (const celula of lista) {
        if (celula.idForma === idForma) {
            removeu = true;
            continue;
        }

        resultado.push(Object.freeze({ ...celula, ordem: resultado.length }));
    }

    if (!removeu) {
        return lista;
    }

    return Object.freeze(resultado);
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

export function celulasCarregar(camadasY) {
    for (const camadaY of camadasY) {
        for (const grupoCor of camadaY.cores) {
            const celula = Object.freeze({
                cor: grupoCor.cor,
                idForma: null,
                idGrupo: null,
                ordem: 0
            });
            const lista = Object.freeze([celula]);
            const alteracoes = [];

            for (const posicao of grupoCor.posicoes) {
                alteracoes.push({
                    celulaX: celulasChaveX(posicao),
                    celulaZ: celulasChaveZ(posicao),
                    depois: lista
                });
            }

            celulasAlterar(camadaY.nivelY, alteracoes);
        }
    }
}

export function celulasCompactar() {
    const camadasY = [];

    for (const [nivelY, posicoes] of estado.camadas) {
        if (posicoes.size === 0) {
            continue;
        }

        const porCor = new Map();

        for (const [chave, lista] of posicoes) {
            const cor = lista[0].cor;

            if (!porCor.has(cor)) {
                porCor.set(cor, []);
            }

            porCor.get(cor).push(chave);
        }

        const cores = [];

        for (const [cor, chavesDaCor] of porCor) {
            cores.push({ cor: cor, posicoes: chavesDaCor });
        }

        camadasY.push({ nivelY: nivelY, cores: cores });
    }

    return camadasY;
}