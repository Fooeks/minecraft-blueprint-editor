import { estado } from "./estado.js";
import { celulasAlterar, celulasListasIguais } from "./celulas.js";

let historicoAvisarFuncao = null;

export function historicoAoMudar(funcao) {
    historicoAvisarFuncao = funcao;
}

function historicoAvisar() {
    if (historicoAvisarFuncao !== null) {
        historicoAvisarFuncao();
    }
}

function historicoChave(mudanca) {
    return mudanca.nivelY + ":" + mudanca.celulaX + ":" + mudanca.celulaZ;
}

export function historicoIniciarAcao() {
    if (estado.historico.acaoAberta !== null) {
        historicoFecharAcao();
    }

    estado.historico.acaoAberta = new Map();
}

export function historicoRegistrar(mudancas) {
    const acao = estado.historico.acaoAberta;

    if (acao === null) {
        return;
    }

    for (const mudanca of mudancas) {
        const chave = historicoChave(mudanca);
        const existente = acao.get(chave);

        if (existente === undefined) {
            acao.set(chave, {
                nivelY: mudanca.nivelY,
                celulaX: mudanca.celulaX,
                celulaZ: mudanca.celulaZ,
                antes: mudanca.antes,
                depois: mudanca.depois
            });
        } else {
            acao.set(chave, {
                nivelY: existente.nivelY,
                celulaX: existente.celulaX,
                celulaZ: existente.celulaZ,
                antes: existente.antes,
                depois: mudanca.depois
            });
        }
    }
}

export function historicoRegistrarForma(idForma, nivelY, antes, depois) {
    const acao = estado.historico.acaoAberta;

    if (acao === null) {
        return;
    }

    const chave = "forma:" + idForma;
    const existente = acao.get(chave);

    if (existente === undefined) {
        acao.set(chave, { idForma, nivelY, antes, depois });
    } else {
        acao.set(chave, {
            idForma: existente.idForma,
            nivelY: existente.nivelY,
            antes: existente.antes,
            depois: depois
        });
    }
}

export function historicoFecharAcao() {
    const acao = estado.historico.acaoAberta;

    estado.historico.acaoAberta = null;

    if (acao === null) {
        return;
    }

    const entradas = [];

    for (const entrada of acao.values()) {
        if (entrada.idForma !== undefined) {
            if (entrada.antes !== entrada.depois) {
                entradas.push(entrada);
            }
        } else {
            if (!celulasListasIguais(entrada.antes, entrada.depois)) {
                entradas.push(entrada);
            }
        }
    }

    if (entradas.length === 0) {
        return;
    }

    estado.historico.desfazer.push(entradas);
    estado.historico.refazer = [];
    historicoAvisar();
}

function historicoAplicar(acao, campo) {
    const porCamada = new Map();

    for (const entrada of acao) {
        if (entrada.idForma !== undefined) {
            if (entrada[campo] === null) {
                estado.formas.delete(entrada.idForma);
            } else {
                estado.formas.set(entrada.idForma, entrada[campo]);
            }
            continue;
        }

        if (!porCamada.has(entrada.nivelY)) {
            porCamada.set(entrada.nivelY, []);
        }

        porCamada.get(entrada.nivelY).push({
            celulaX: entrada.celulaX,
            celulaZ: entrada.celulaZ,
            depois: entrada[campo]
        });
    }

    for (const [nivelY, alteracoes] of porCamada) {
        celulasAlterar(nivelY, alteracoes);
    }
}

export function historicoDesfazer() {
    const historico = estado.historico;

    if (historico.acaoAberta !== null || historico.desfazer.length === 0) {
        return null;
    }

    const acao = historico.desfazer.pop();

    historicoAplicar(acao, "antes");
    historico.refazer.push(acao);
    historicoAvisar();

    return acao[0].nivelY;
}

export function historicoRefazer() {
    const historico = estado.historico;

    if (historico.acaoAberta !== null || historico.refazer.length === 0) {
        return null;
    }

    const acao = historico.refazer.pop();

    historicoAplicar(acao, "depois");
    historico.desfazer.push(acao);
    historicoAvisar();

    return acao[0].nivelY;
}

export function historicoZerar() {
    estado.historico.desfazer = [];
    estado.historico.refazer = [];
    estado.historico.acaoAberta = null;
    historicoAvisar();
}