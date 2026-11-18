import { estado } from "./estado.js";
import { celulasObter, celulasListaSoltar, celulasAlterar, celulasListaInserir } from "./celulas.js";
import { historicoRegistrar, historicoRegistrarForma } from "./historico.js";
import { geometriaLimite, geometriaRasterizar } from "./geometria.js";

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

    const celulaNova = Object.freeze({ cor: parametros.cor, idForma: id, idGrupo: null, ordem: 0 });
    const listaSimples = Object.freeze([celulaNova]);
    const alteracoes = [];

    for (const posicao of geometriaRasterizar(forma)) {
        const lista = celulasObter(forma.nivelY, posicao.celulaX, posicao.celulaZ);
        const listaNova = celulasListaInserir(lista, celulaNova, listaSimples);

        alteracoes.push({ celulaX: posicao.celulaX, celulaZ: posicao.celulaZ, depois: listaNova });
    }

    const mudancas = formaAlterarCelulas(forma.nivelY, alteracoes, "sobrescrever");

    historicoRegistrar(mudancas);

    return forma;
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