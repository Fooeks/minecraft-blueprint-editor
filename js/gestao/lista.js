export function montarListaProjetos(fieldset, nomeGrupo, projetos) {
    
    const antigos = fieldset.querySelectorAll("label");
    for (const antigo of antigos) {
        antigo.remove();
    }

    for (const projeto of projetos) {
        const label = document.createElement("label");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = nomeGrupo;
        radio.value = projeto.idProjeto;

        const spanNome = document.createElement("span");
        spanNome.textContent = projeto.nome;

        const spanData = document.createElement("span");
        spanData.textContent = new Date(projeto.dataAtualizacao).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });

        label.append(radio, spanNome, spanData);
        fieldset.append(label);
    }
}