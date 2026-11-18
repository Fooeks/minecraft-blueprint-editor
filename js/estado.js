export const estado = {
    projetoAberto: null,
    ferramenta: "pincel",
    camera: {
        deslocamentoX: 0,
        deslocamentoZ: 0,
        pixelsPorCelula: 20
    },
    camadas: new Map(),
    camadaAtiva: 1,
    celulaDestacada: null,
    abaAtiva: null,
    corAtiva: "#00aa00",
    coresRecentes:[],
    formas: new Map(),
    proximaIdForma: 1,
    previaForma: null,
    alteracoesPendentes: false,
    versaoAlteracoes: 0,
    historico: {
        desfazer: [],
        refazer: [],
        acaoAberta: null
    }
};