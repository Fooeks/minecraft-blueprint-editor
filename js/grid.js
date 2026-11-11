import { estado } from "./estado.js";
import { guardarUltimoProjeto } from "./armazenamento.js";
import { celulasCarregar, celulasDescartar, celulasLimiteCamadaY, celulasPercorrer } from "./celulas.js";
import { abasSincronizar } from "./painel/abas.js";

const gridGrid = document.getElementById("grid");
const gridMensagemVazio = document.getElementById("mensagem-vazio");
const gridDesenho = document.getElementById("grid-desenho");
const contexto = gridDesenho.getContext("2d");
const camadaYCampo = document.getElementById("campo-camada-y");
const camadaYSlider = document.getElementById("slider-camada-y");

let redesenhoPendente = false;

function celulaXParaPixel(celulaX) {
    return (celulaX - estado.camera.deslocamentoX) * estado.camera.pixelsPorCelula;
}

function celulaZParaPixel(celulaZ) {
    return (celulaZ - estado.camera.deslocamentoZ) * estado.camera.pixelsPorCelula;
}

export function pixelParaCelulaX(pixel) {
    return pixel / estado.camera.pixelsPorCelula + estado.camera.deslocamentoX;
}

export function pixelParaCelulaZ(pixel) {
    return pixel / estado.camera.pixelsPorCelula + estado.camera.deslocamentoZ;
}

function calcularLimitesVisiveis() {
    const totalCelulasX = estado.projetoAberto.dimensaoX;
    const totalCelulasZ = estado.projetoAberto.dimensaoZ;

    return {
        primeiraCelulaX: Math.max(0, Math.floor(estado.camera.deslocamentoX)),
        ultimaCelulaX: Math.min(totalCelulasX, Math.ceil(pixelParaCelulaX(gridDesenho.width))),
        primeiraCelulaZ: Math.max(0, Math.floor(estado.camera.deslocamentoZ)),
        ultimaCelulaZ: Math.min(totalCelulasZ, Math.ceil(pixelParaCelulaZ(gridDesenho.height)))
    };
}

function criarGrid() {
    if (estado.projetoAberto === null) {
        return;
    }

    const limites = calcularLimitesVisiveis();

    contexto.strokeStyle = "rgba(90, 70, 40, 0.25)";
    contexto.lineWidth = 1;

    const topo = celulaZParaPixel(limites.primeiraCelulaZ);
    const base = celulaZParaPixel(limites.ultimaCelulaZ);
    const esquerda = celulaXParaPixel(limites.primeiraCelulaX);
    const direita = celulaXParaPixel(limites.ultimaCelulaX);

    contexto.beginPath();

    for (let celulaX = limites.primeiraCelulaX; celulaX <= limites.ultimaCelulaX; celulaX++) {
        const x = celulaXParaPixel(celulaX) + 0.5;
        contexto.moveTo(x, topo);
        contexto.lineTo(x, base);
    }

    for (let celulaZ = limites.primeiraCelulaZ; celulaZ <= limites.ultimaCelulaZ; celulaZ++) {
        const z = celulaZParaPixel(celulaZ) + 0.5;
        contexto.moveTo(esquerda, z);
        contexto.lineTo(direita, z);
    }

    contexto.stroke();
}

function limitarEixo(inicio, tamanhoGrid, tamanhoVisivel, minimoVisivel) {
    const minimo = Math.min(minimoVisivel, tamanhoGrid);
    const menorInicio = minimo - tamanhoVisivel;
    const maiorInicio = tamanhoGrid - minimo;

    return Math.max(menorInicio, Math.min(inicio, maiorInicio));
}

function restringirValor(valor, minimo, maximo) {
    const minimoValido = Math.min(minimo, maximo);
    return Math.max(minimoValido, Math.min(valor, maximo));
}

function calcularTamanhoMinimoCelula(dimensaoX, dimensaoZ, celulaX, celulaZ) {
    const tamanhoPorX = celulaX / dimensaoX;
    const tamanhoPorZ = celulaZ / dimensaoZ;

    return Math.min(tamanhoPorX, tamanhoPorZ);
}

export function restringirTamanhoCelula(tamanho) {
    const minimo = calcularTamanhoMinimoCelula(estado.projetoAberto.dimensaoX, estado.projetoAberto.dimensaoZ, gridDesenho.width, gridDesenho.height);
    const minimoZoom = Math.max(minimo, 6);

    return restringirValor(tamanho, minimoZoom, 60);
}

function aplicarLimiteDeTamanho() {
    if (estado.projetoAberto === null) {
        return;
    }

    estado.camera.pixelsPorCelula = restringirTamanhoCelula(estado.camera.pixelsPorCelula);
}

function centralizarCamera() {
    const visivelX = gridDesenho.width / estado.camera.pixelsPorCelula;
    const visivelZ = gridDesenho.height / estado.camera.pixelsPorCelula;

    estado.camera.deslocamentoX = (estado.projetoAberto.dimensaoX - visivelX) / 2;
    estado.camera.deslocamentoZ = (estado.projetoAberto.dimensaoZ - visivelZ) / 2;
}

function limitarCamera() {
    if (estado.projetoAberto === null) {
        return;
    }

    const visivelX = gridDesenho.width / estado.camera.pixelsPorCelula;
    const visivelZ = gridDesenho.height / estado.camera.pixelsPorCelula;

    estado.camera.deslocamentoX = limitarEixo(estado.camera.deslocamentoX, estado.projetoAberto.dimensaoX, visivelX, 40 / estado.camera.pixelsPorCelula);
    estado.camera.deslocamentoZ = limitarEixo(estado.camera.deslocamentoZ, estado.projetoAberto.dimensaoZ, visivelZ, 40 / estado.camera.pixelsPorCelula);
}

const opacidadeCamadaYAbaixo = 0.3;

function desenharCamadaY(nivelY, opacidade) {
    const limites = calcularLimitesVisiveis();
    const tamanho = estado.camera.pixelsPorCelula;
    let corAtual = null;

    contexto.globalAlpha = opacidade;

    celulasPercorrer(nivelY, limites, (celulaX, celulaZ, lista) => {
        const celula = lista[0];

        if (celula.cor !== corAtual) {
            contexto.fillStyle = celula.cor;
            corAtual = celula.cor;
        }

        contexto.fillRect(celulaXParaPixel(celulaX), celulaZParaPixel(celulaZ), tamanho, tamanho);
    });

    contexto.globalAlpha = 1;
}

function desenharCelulas() {
    if (estado.projetoAberto === null) {
        return;
    }

    if (estado.camadaAtiva > 1) {
        desenharCamadaY(estado.camadaAtiva - 1, opacidadeCamadaYAbaixo);
    }

    desenharCamadaY(estado.camadaAtiva, 1);
}

function limparDesenho() {
    contexto.clearRect(0, 0, gridDesenho.width, gridDesenho.height);
}

const destaqueContorno = 1.5;
const destaqueContornoCor = "rgba(90, 70, 40, 0.50)";
const destaqueDegradeCentro = "rgba(247, 240, 223, 0)";
const destaqueDegradeBorda = "rgba(247, 240, 223, 0.7)";

function destacarCelula() {
    if (estado.projetoAberto === null || estado.celulaDestacada === null) {
        return;
    }

    const tamanho = estado.camera.pixelsPorCelula;
    const x = celulaXParaPixel(estado.celulaDestacada.celulaX);
    const z = celulaZParaPixel(estado.celulaDestacada.celulaZ);
    const centroX = x + tamanho / 2;
    const centroZ = z + tamanho / 2;

    const degrade = contexto.createRadialGradient(centroX, centroZ, 0, centroX, centroZ, tamanho * Math.SQRT1_2);
    degrade.addColorStop(0, destaqueDegradeCentro);
    degrade.addColorStop(1, destaqueDegradeBorda);

    contexto.fillStyle = degrade;
    contexto.fillRect(x, z, tamanho, tamanho);

    contexto.strokeStyle = destaqueContornoCor;
    contexto.lineWidth = destaqueContorno;
    contexto.strokeRect(
        x + destaqueContorno / 2,
        z + destaqueContorno / 2,
        tamanho - destaqueContorno,
        tamanho - destaqueContorno
    );
}

export function verificarPosicaoCelula(celulaX, celulaZ) {
    return celulaX >= 0 && celulaX < estado.projetoAberto.dimensaoX
        && celulaZ >= 0 && celulaZ < estado.projetoAberto.dimensaoZ;
}

function redesenhar() {
    redesenhoPendente = false;
    aplicarLimiteDeTamanho();
    limitarCamera();
    limparDesenho();
    desenharCelulas();
    criarGrid();
    destacarCelula();
}

export function pedirRedesenho() {
    if (redesenhoPendente) {
        return;
    }

    redesenhoPendente = true;
    requestAnimationFrame(redesenhar);
}

function reiniciarCamadaY() {
    estado.camadaAtiva = 1;
    camadaYCampo.value = estado.camadaAtiva;
    camadaYSlider.max = celulasLimiteCamadaY(estado.camadaAtiva);
    camadaYSlider.value = estado.camadaAtiva;
}

function reiniciarCamera() {
    estado.camera.pixelsPorCelula = restringirTamanhoCelula(20);
    centralizarCamera();
}


export function exibirProjeto(projeto) {
    const { camadas, ...dadosProjeto} = projeto;

    estado.projetoAberto = dadosProjeto;
    celulasDescartar();
    celulasCarregar(camadas ?? []);
    estado.celulaDestacada = null;
    reiniciarCamadaY();
    reiniciarCamera();
    estado.abaAtiva = "cor";
    estado.alteracoesPendentes = false;
    gridMensagemVazio.hidden = true;
    gridDesenho.hidden = false;
    pedirRedesenho();
    abasSincronizar();
    guardarUltimoProjeto(projeto.idProjeto);
}

export function limparProjeto() {
    estado.projetoAberto = null;
    celulasDescartar();
    estado.celulaDestacada = null;
    reiniciarCamadaY();
    estado.abaAtiva = null;
    estado.alteracoesPendentes = false;
    gridDesenho.hidden = true;
    gridMensagemVazio.hidden = false;
    abasSincronizar();
}

function ajustarTamanhoGrid() {
    gridDesenho.width = gridGrid.clientWidth;
    gridDesenho.height = gridGrid.clientHeight;
    pedirRedesenho();
}

window.addEventListener("resize", ajustarTamanhoGrid);

ajustarTamanhoGrid();