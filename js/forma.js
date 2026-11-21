import { estado } from "./estado.js";
import { celulasObter, celulasListaSoltar, celulasAlterar, celulasListaInserir, celulasListaRemover } from "./celulas.js";
import { historicoRegistrar, historicoRegistrarForma } from "./historico.js";
import { geometriaLimite, geometriaRasterizar } from "./geometria.js";

export const formaEventoRascunhoMudou = "formarascunhomudou";
export const formaEventoSelecionar = "formaselecionar";

export function formaDissolver(idForma) {
    const forma = estado.formas.get(idForma);

    if (forma === undefined) {
        return [];
    }

    const alteracoes = [];

    for (const posicao of geometriaRasterizar(forma)) {
        const lista = celulasObter(forma.nivelY, posicao.celulaX, posicao.celulaZ);
        const depois = celulasListaSoltar(lista, idForma);

        if (depois !== lista) {
            alteracoes.push({ celulaX: posicao.celulaX, celulaZ: posicao.celulaZ, depois: depois });
        }
    }

    const mudancas = celulasAlterar(forma.nivelY, alteracoes);

    historicoRegistrarForma(idForma, forma.nivelY, forma, null);
    estado.formas.delete(idForma);

    return mudancas;
}

export function formaAlterarCelulas(nivelY, alteracoes, modo) {
    const mudancas = celulasAlterar(nivelY, alteracoes);
    const idsParaDissolver = new Set();

    for (const mudanca of mudancas) {
        for (const celula of mudanca.antes) {
            if (celula.idForma === null) {
                continue;
            }

            const continuaPresente = mudanca.depois.some(nova => nova.idForma === celula.idForma);

            if (continuaPresente) {
                continue;
            }

            const forma = estado.formas.get(celula.idForma);

            if (forma === undefined) {
                continue;
            }

            if (modo === "editar" && forma.estilo === "preenchida" && !geometriaLimite(forma, mudanca.celulaX, mudanca.celulaZ)) {
                continue;
            }

            idsParaDissolver.add(celula.idForma);
        }
    }

    for (const idForma of idsParaDissolver) {
        for (const mudancaExtra of formaDissolver(idForma)) {
            mudancas.push(mudancaExtra);
        }
    }

    return mudancas;
}

function formaGravarCelulas(forma) {
    const celulaNova = Object.freeze({ cor: forma.cor, idForma: forma.idForma, idGrupo: null, ordem: 0 });
    const listaSimples = Object.freeze([celulaNova]);
    const alteracoes = [];

    for (const posicao of geometriaRasterizar(forma)) {
        const lista = celulasObter(forma.nivelY, posicao.celulaX, posicao.celulaZ);
        const listaNova = celulasListaInserir(lista, celulaNova, listaSimples);

        alteracoes.push({ celulaX: posicao.celulaX, celulaZ: posicao.celulaZ, depois: listaNova });
    }

    const mudancas = formaAlterarCelulas(forma.nivelY, alteracoes, "sobrescrever");

    historicoRegistrar(mudancas);
}

export function formaInserir(parametros) {
    const id = estado.proximaIdForma;

    estado.proximaIdForma += 1;

    const forma = Object.freeze({
        ...parametros,
        idForma: id,
        nivelY: estado.camadaAtiva,
        nome: parametros.tipo === "poligono" ? "Polígono " + id : "Superelipse " + id,
        bloqueado: false
    });

    estado.formas.set(id, forma);
    historicoRegistrarForma(id, forma.nivelY, null, forma);

    formaGravarCelulas(forma);

    return forma;
}

export function formaAtualizar(idForma, parametros) {
    const original = estado.formas.get(idForma);

    if (original === undefined) {
        return null;
    }

    const apagar = [];

    for (const posicao of geometriaRasterizar(original)) {
        const lista = celulasObter(original.nivelY, posicao.celulaX, posicao.celulaZ);
        const listaNova = celulasListaRemover(lista, idForma);

        if (listaNova !== lista) {
            apagar.push({ celulaX: posicao.celulaX, celulaZ: posicao.celulaZ, depois: listaNova });
        }
    }

    historicoRegistrar(celulasAlterar(original.nivelY, apagar));

    const nova = Object.freeze({
        ...parametros,
        idForma: idForma,
        nivelY: original.nivelY,
        nome: original.nome,
        tipo: original.tipo,
        bloqueado: original.bloqueado
    });

    estado.formas.set(idForma, nova);
    historicoRegistrarForma(idForma, original.nivelY, original, nova);

    formaGravarCelulas(nova);

    return nova;
}

export function formaExcluir(idForma) {
    const forma = estado.formas.get(idForma);

    if (forma === undefined) {
        return false;
    }

    const apagar = [];

    for (const posicao of geometriaRasterizar(forma)) {
        const lista = celulasObter(forma.nivelY, posicao.celulaX, posicao.celulaZ);
        const listaNova = celulasListaRemover(lista, idForma);

        if (listaNova !== lista) {
            apagar.push({ celulaX: posicao.celulaX, celulaZ: posicao.celulaZ, depois: listaNova });
        }
    }

    historicoRegistrar(celulasAlterar(forma.nivelY, apagar));

    historicoRegistrarForma(idForma, forma.nivelY, forma, null);
    estado.formas.delete(idForma);

    return true;
}

export function formaRascunhoDescartar() {
    if (estado.previaForma === null) {
        return;
    }

    if (estado.previaForma.idForma === null) {
        return;
    }

    estado.previaForma = null;
}

export function formaMontarCelulaPintada(lista, celulaX, celulaZ, cor) {
    const celulaSolta = Object.freeze({ cor: cor, idForma: null, idGrupo: null, ordem: 0 });

    if (lista.length === 0) {
        return celulaSolta;
    }

    if (lista[0].idForma === null) {
        return celulaSolta;
    }

    const forma = estado.formas.get(lista[0].idForma);

    if (forma === undefined) {
        return celulaSolta;
    }

    if (forma.estilo === "preenchida" && !forma.bloqueado && !geometriaLimite(forma, celulaX, celulaZ)) {
        return Object.freeze({ cor: cor, idForma: lista[0].idForma, idGrupo: lista[0].idGrupo, ordem: 0 });
    }

    return celulaSolta;
}