import { estado } from "./estado.js";
import { guardarUltimoProjeto } from "./armazenamento.js";

const gridGrid = document.getElementById("grid");
const gridMensagemVazio = document.getElementById("mensagem-vazio");
const gridDesenho = document.getElementById("grid-desenho");
const contexto = gridDesenho.getContext("2d");

let redesenhoPendente = false;

function celulaXParaPixel(celulaX) {
    return (celulaX - estado.camera.deslocamentoX) * estado.camera.pixelsPorCelula;
}

function celulaZParaPixel(celulaZ) {
    return (celulaZ - estado.camera.deslocamentoZ) * estado.camera.pixelsPorCelula;
}

function pixelParaCelulaX(pixel) {
    return pixel / estado.camera.pixelsPorCelula + estado.camera.deslocamentoX;
}

function pixelParaCelulaZ(pixel) {
    return pixel / estado.camera.pixelsPorCelula + estado.camera.deslocamentoZ;
}

function criarGrid() {
    if (estado.projetoAberto === null) {
        return;
    }

    const dimensaoX = estado.projetoAberto.dimensaoX;
    const dimensaoZ = estado.projetoAberto.dimensaoZ;

    contexto.clearRect(0, 0, gridDesenho.width, gridDesenho.height);
    contexto.strokeStyle = "#e40d0d";
    contexto.lineWidth = 1;

    const primeiraCelulaX = Math.max(0, Math.floor(estado.camera.deslocamentoX));
    const ultimaCelulaX = Math.min(dimensaoX, Math.ceil(pixelParaCelulaX(gridDesenho.width)));
    const primeiraCelulaZ = Math.max(0, Math.floor(estado.camera.deslocamentoZ));
    const ultimaCelulaZ = Math.min(dimensaoZ, Math.ceil(pixelParaCelulaZ(gridDesenho.height)));

    const topo = celulaZParaPixel(primeiraCelulaZ);
    const base = celulaZParaPixel(ultimaCelulaZ);
    const esquerda = celulaXParaPixel(primeiraCelulaX);
    const direita = celulaXParaPixel(ultimaCelulaX);


    contexto.beginPath();

    for (let celulaX = primeiraCelulaX; celulaX <= ultimaCelulaX; celulaX++) {
        const x = celulaXParaPixel(celulaX) + 0.5;
        contexto.moveTo(x, topo);
        contexto.lineTo(x, base);
    }

    for (let celulaZ = primeiraCelulaZ; celulaZ <= ultimaCelulaZ; celulaZ++) {
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

function limitarCamera() {
    if (estado.projetoAberto === null) {
        return;
    }

    const visivelX = gridDesenho.width / estado.camera.pixelsPorCelula;
    const visivelZ = gridDesenho.height / estado.camera.pixelsPorCelula;

    estado.camera.deslocamentoX = limitarEixo(estado.camera.deslocamentoX, estado.projetoAberto.dimensaoX, visivelX, 2);
    estado.camera.deslocamentoZ = limitarEixo(estado.camera.deslocamentoZ, estado.projetoAberto.dimensaoZ, visivelZ, 2);
}

function redesenhar() {
    redesenhoPendente = false;
    limitarCamera();
    criarGrid();
}

export function pedirRedesenho() {
    if (redesenhoPendente) {
        return;
    }

    redesenhoPendente = true;
    requestAnimationFrame(redesenhar);
}

function reiniciarCamera() {
    estado.camera.deslocamentoX = 0;
    estado.camera.deslocamentoZ = 0;
}


export function exibirProjeto(projeto) {
    estado.projetoAberto = projeto;
    reiniciarCamera();
    gridMensagemVazio.hidden = true;
    gridDesenho.hidden = false;
    pedirRedesenho();
    guardarUltimoProjeto(projeto.idProjeto);
}

export function limparProjeto() {
    estado.projetoAberto = null;
    gridDesenho.hidden = true;
    gridMensagemVazio.hidden = false;
}

function ajustarTamanhoGrid() {
    gridDesenho.width = gridGrid.clientWidth;
    gridDesenho.height = gridGrid.clientHeight;
    pedirRedesenho();
}

window.addEventListener("resize", ajustarTamanhoGrid);

ajustarTamanhoGrid();