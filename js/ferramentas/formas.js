import { estado } from "../estado.js";
import { geometriaRasterizar } from "../geometria.js";
import { pedirRedesenho, centroVisivelCelula } from "../grid.js";
import { abasSincronizar } from "../painel/abas.js";
import { selecionarFerramenta, janelaAberta, campoDeTexto } from "./ativa.js";
import { formaInserir } from "../forma.js";
import { historicoFecharAcao, historicoIniciarAcao } from "../historico.js";
import { celulasEventoMudou } from "../celulas.js";

const formasCampoX = document.getElementById("campo-forma-dimensao-x");
const formasCampoZ = document.getElementById("campo-forma-dimensao-z");
const formasCampoLados = document.getElementById("campo-forma-lados");
const formasCampoExpoente = document.getElementById("campo-forma-expoente");
const formasCampoRotacao = document.getElementById("campo-forma-rotacao");
const formasAlerta = document.getElementById("forma-alerta");
const formasBotaoConfirmarPainel = document.getElementById("btn-forma-confirmar");
const formasBotaoConfirmarBarra = document.getElementById("btn-previa-confirmar");
const formasSubabaPoligono = document.getElementById("subaba-poligono");
const formasSubabaSuperelipse = document.getElementById("subaba-superelipse");
const formasSubconteudoPoligono = document.getElementById("subconteudo-poligono");
const formasSubconteudoSuperelipse = document.getElementById("subconteudo-superelipse");
const formasBotaoFormas = document.getElementById("ferr-formas");
const formasBotaoCancelarPainel = document.getElementById("btn-forma-cancelar");
const formasBotaoCancelarBarra = document.getElementById("btn-previa-cancelar");
const formasRadiosEstilo = document.querySelectorAll('input[name="forma-estilo"]');

let formasTipo = "poligono";

function formasLerNumero(campo) {
    if (campo.value.trim() === "") {
        return Number.NaN;
    }

    return Number(campo.value);
}

function formasLerParametros() {
    const dimensaoX = formasLerNumero(formasCampoX);
    const dimensaoZ = formasLerNumero(formasCampoZ);
    const lados = formasLerNumero(formasCampoLados);
    const expoente = formasLerNumero(formasCampoExpoente);
    const rotacao = formasLerNumero(formasCampoRotacao);

    const dimensaoXInvalida = !Number.isInteger(dimensaoX) || dimensaoX < 1 || dimensaoX > estado.projetoAberto.dimensaoX;
    const dimensaoZInvalida = !Number.isInteger(dimensaoZ) || dimensaoZ < 1 || dimensaoZ > estado.projetoAberto.dimensaoZ;
    const ladosInvalidos = formasTipo === "poligono"
        && (!Number.isInteger(lados) || lados < 3 || lados > 32);
    const expoenteInvalido = formasTipo === "superelipse"
        && (!Number.isFinite(expoente) || expoente < 0.5 || expoente > 10);
    const rotacaoInvalida = !Number.isFinite(rotacao);

    formasCampoX.classList.toggle("campo-invalido", dimensaoXInvalida);
    formasCampoZ.classList.toggle("campo-invalido", dimensaoZInvalida);
    formasCampoLados.classList.toggle("campo-invalido", ladosInvalidos);
    formasCampoExpoente.classList.toggle("campo-invalido", expoenteInvalido);
    formasCampoRotacao.classList.toggle("campo-invalido", rotacaoInvalida);

    if (dimensaoXInvalida || dimensaoZInvalida) {
        return { parametros: null, erro: "As dimensões X e Z devem ser inteiros de 1 até o tamanho do grid." };
    }

    if (ladosInvalidos) {
        return { parametros: null, erro: "A quantidade de lados deve ser um inteiro de 3 a 32." };
    }

    if (expoenteInvalido) {
        return { parametros: null, erro: "O expoente deve ser um número de 0,5 a 10." };
    }

    if (rotacaoInvalida) {
        return { parametros: null, erro: "A rotação deve ser um número em graus." };
    }

    const estiloMarcado = document.querySelector('input[name="forma-estilo"]:checked').value;

    return {
        parametros: {
            tipo: formasTipo,
            dimensaoX: dimensaoX,
            dimensaoZ: dimensaoZ,
            lados: formasTipo === "poligono" ? lados : null,
            expoente: formasTipo === "superelipse" ? expoente : null,
            estilo: estiloMarcado,
            rotacao: ((rotacao % 360) + 360) % 360,
            cor: estado.corAtiva
        },
        erro: null
    };
}

function formasMostrarAlerta(texto) {
    if (texto === null) {
        formasAlerta.hidden = true;
        formasAlerta.textContent = "";
        return;
    }

    formasAlerta.textContent = texto;
    formasAlerta.hidden = false;
}

function formasPosicionar(parametros, centroX, centroZ) {
    const posicaoX = centroX - Math.floor(parametros.dimensaoX / 2);
    const posicaoZ = centroZ - Math.floor(parametros.dimensaoZ / 2);

    return {
        posicaoX: Math.max(0, Math.min(posicaoX, estado.projetoAberto.dimensaoX - parametros.dimensaoX)),
        posicaoZ: Math.max(0, Math.min(posicaoZ, estado.projetoAberto.dimensaoZ - parametros.dimensaoZ))
    };
}

function formasPermitirInserir(permitido) {
    formasBotaoConfirmarPainel.disabled = !permitido;
    formasBotaoConfirmarBarra.disabled = !permitido;
}

function formasAtualizarPrevia() {
    const { parametros, erro } = formasLerParametros();

    if (parametros === null) {
        formasMostrarAlerta(erro);
        formasPermitirInserir(false);
        return;
    }

    const celulas = geometriaRasterizar({ ...parametros, posicaoX: 0, posicaoZ: 0 });

    if (celulas.length === 0) {
        formasMostrarAlerta("A forma não ocupa nenhuma célula com esses parâmetros.");
        formasPermitirInserir(false);
        return;
    }

    let centroX;
    let centroZ;

    if (estado.previaForma !== null) {
        const anterior = estado.previaForma.forma;

        centroX = anterior.posicaoX + Math.floor(anterior.dimensaoX / 2);
        centroZ = anterior.posicaoZ + Math.floor(anterior.dimensaoZ / 2);
    } else {
        const centro = centroVisivelCelula();

        centroX = centro.celulaX;
        centroZ = centro.celulaZ;
    }

    const posicao = formasPosicionar(parametros, centroX, centroZ);

    estado.previaForma = { forma: { ...parametros, ...posicao }, celulas: celulas };
    formasMostrarAlerta(null);
    formasPermitirInserir(true);
    pedirRedesenho();
}

function formasTrocarTipo(tipo) {
    formasTipo = tipo;

    formasSubabaPoligono.classList.toggle("marcado", tipo === "poligono");
    formasSubabaSuperelipse.classList.toggle("marcado", tipo === "superelipse");
    formasSubconteudoPoligono.hidden = tipo !== "poligono";
    formasSubconteudoSuperelipse.hidden = tipo !== "superelipse";
}

function formasCriarPrevia() {
    if (estado.projetoAberto === null) {
        return;
    }

    formasCampoX.value = Math.min(10, estado.projetoAberto.dimensaoX);
    formasCampoZ.value = Math.min(10, estado.projetoAberto.dimensaoZ);
    formasCampoLados.value = 4;
    formasCampoExpoente.value = 2;
    formasCampoRotacao.value = 0;
    document.querySelector('input[name="forma-estilo"][value="contorno"]').checked = true;
    formasTrocarTipo("poligono");

    estado.previaForma = null;

    formasAtualizarPrevia();

    estado.abaAtiva = "propriedades";
    abasSincronizar();
    selecionarFerramenta("selecao");
}

function formasConfirmar() {
    if (estado.projetoAberto === null || estado.previaForma === null) {
        return;
    }

    if (formasBotaoConfirmarPainel.disabled) {
        return;
    }

    const parametros = { ...estado.previaForma.forma, cor: estado.corAtiva };

    historicoIniciarAcao();
    formaInserir(parametros);
    historicoFecharAcao();

    estado.previaForma = null;
    pedirRedesenho();
    document.dispatchEvent(new Event(celulasEventoMudou));
}

function formasCancelar() {
    estado.previaForma = null;
    pedirRedesenho();
}

function formasTeclado(evento) {
    if (estado.projetoAberto === null || estado.previaForma === null) {
        return;
    }

    if (evento.ctrlKey || evento.altKey || evento.metaKey || evento.shiftKey) {
        return;
    }

    if (evento.repeat || janelaAberta()) {
        return;
    }

    if (evento.key !== "Enter" && evento.key !== "Escape") {
        return;
    }

    if (evento.target.closest("#propriedades-forma") !== null) {
        if (evento.key === "Escape") {
            evento.target.blur();
        }

        return;
    }

    if (campoDeTexto(evento.target)) {
        return;
    }

    if (evento.key === "Escape") {
        formasCancelar();
        return;
    }

    if (evento.target.closest("button") !== null) {
        return;
    }

    formasConfirmar();
}

export function formasIniciar() {
    formasBotaoFormas.addEventListener("click", formasCriarPrevia);

    formasSubabaPoligono.addEventListener("click", () => {
        formasTrocarTipo("poligono");
        formasAtualizarPrevia();
    });

    formasSubabaSuperelipse.addEventListener("click", () => {
        formasTrocarTipo("superelipse");
        formasAtualizarPrevia();
    });

    for (const campo of [formasCampoX, formasCampoZ, formasCampoLados, formasCampoExpoente, formasCampoRotacao]) {
        campo.addEventListener("input", formasAtualizarPrevia);
    }

    for (const radio of formasRadiosEstilo) {
        radio.addEventListener("change", formasAtualizarPrevia);
    }

    formasBotaoConfirmarPainel.addEventListener("click", formasConfirmar);
    formasBotaoConfirmarBarra.addEventListener("click", formasConfirmar);
    formasBotaoCancelarPainel.addEventListener("click", formasCancelar);
    formasBotaoCancelarBarra.addEventListener("click", formasCancelar);

    document.addEventListener("keydown", formasTeclado);
}