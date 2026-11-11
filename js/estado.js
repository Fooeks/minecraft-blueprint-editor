export const estado = {
    projetoAberto: null,
    ferramenta: "selecao",
    camera: {
        deslocamentoX: 0,
        deslocamentoZ: 0,
        pixelsPorCelula: 20
    },
    camadas: new Map(),
    camadaAtiva: 1,
    celulaDestacada: null,
    abaAtiva: null,
    corAtiva: "#55ff55",
    alteracoesPendentes: false,
    versaoAlteracoes: 0
};