/*
  PROJETO: Landing / Flyer Experiência Black
  ARQUIVO: js/app.js

  VERSÃO AJUSTADA: V27 - STATUS DINÂMICO 100%

  OBJETIVO DESTE ARQUIVO:
  - Controlar o áudio da chamada/vinheta.
  - Controlar o áudio da rádio ao vivo.
  - Abrir links externos.
  - Atualizar o selo dinâmico dentro do flyer:
    PAUSADO / VINHETA / CONECTANDO / AO VIVO / ERRO.
  - Atualizar o contador de estreia.

  IMPORTANTE:
  Esta versão foi preparada para funcionar mesmo sem o cabeçalho, sem o player lateral
  e sem o botão flutuante "Iniciar experiência". Ou seja: se você remover esses blocos
  do HTML, o site não quebra. O controle principal fica no próprio flyer.
*/

/* =========================================================
   1) CONFIGURAÇÕES PRINCIPAIS
   ========================================================= */

// Configurações externas. Para alterar links/textos sem mexer no código principal, edite js/config.js
const BLACK_CONFIG = window.BLACK_CONFIG || {};

// Link do stream da rádio. É esse endereço que toca quando o usuário escolhe "Rádio".
const STREAM = BLACK_CONFIG.streamUrl || "https://hts02.brascast.com:9890/live";

// Controle manual de status da rádio.
// online  = tenta tocar a rádio normalmente.
// offline = não tenta tocar; abre o link alternativo radioOffline.
const RADIO_STATUS = BLACK_CONFIG.radioStatus || "online";

/*
  Data da estreia usada no contador.
  ATENÇÃO: aqui o mês é mês normal. Julho = 7.
*/
const CONFIG_ESTREIA = Object.assign({
  ano: 2026,
  mes: 7,
  dia: 12,
  hora: 12,
  minuto: 0
}, BLACK_CONFIG.estreia || {});

// Links oficiais dos botões flutuantes do flyer.
const LINKS = Object.assign({
  facebook: "https://www.facebook.com/radioblackinlove/",
  instagram: "https://www.instagram.com/radioblackinl",
  whatsapp: "https://chat.whatsapp.com/HxEVPDog7xh9J8iu4cVvtJ",
  youtube: "https://www.youtube.com/@Betao-BlackRoot",
  site: "https://www.radioblackinlove.com/",
  appRadios: "https://www.radios.com.br/aovivo/black-in-love-radio/29203",
  appAndroid: "https://play.google.com/store/apps/details?id=br.com.radios.radiosmobile.radiosnet",
  appApple: "https://apps.apple.com/br/app/radiosnet/id1089290449",
  radioOffline: "https://www.youtube.com/playlist?list=PLH0Y4fXuozBG1BmItoDSBV-KEoTwxWqSC",
  chamadaDestino: "https://www.youtube.com/watch?v=hylxoxVXkeM",
  reprise: "https://www.youtube.com/watch?v=hylxoxVXkeM&list=PLH0Y4fXuozBG1BmItoDSBV-KEoTwxWqSC"
}, BLACK_CONFIG.links || {});

/* =========================================================
   2) FUNÇÕES CURTAS DE PROTEÇÃO
   =========================================================
   Essas funções deixam o código mais seguro.
   Se algum elemento foi removido do HTML, o JS simplesmente ignora.
   Assim você consegue mexer no VS Code sem quebrar a página inteira.
*/

function pegar(id) {
  return document.getElementById(id);
}

function existe(elemento) {
  return Boolean(elemento);
}

function escreverTexto(elemento, texto) {
  if (elemento) elemento.textContent = texto;
}

function escreverHtml(elemento, html) {
  if (elemento) elemento.innerHTML = html;
}

function trocarClasse(elemento, classe) {
  if (elemento) elemento.className = classe;
}

function adicionarClasse(elemento, classe) {
  if (elemento) elemento.classList.add(classe);
}

function removerClasse(elemento, classe) {
  if (elemento) elemento.classList.remove(classe);
}

function escutar(elemento, evento, funcao) {
  if (elemento) elemento.addEventListener(evento, funcao);
}

function contem(elemento, alvo) {
  return Boolean(elemento && elemento.contains(alvo));
}

/* =========================================================
   3) CAPTURA DOS ELEMENTOS DO HTML
   ========================================================= */

// Áudios.
const introAudio = pegar("introAudio");
const streamAudio = pegar("streamAudio");

// Controles antigos/opcionais do player externo. Podem não existir no HTML atual.
const mainPlayBtn = pegar("mainPlayBtn");
const playIcon = pegar("playIcon");
const muteBtn = pegar("muteBtn");
const volumeControl = pegar("volumeControl");
const headerVolumeBtn = pegar("headerVolumeBtn");
const trackTitle = pegar("trackTitle");
const playerStatus = pegar("playerStatus");
const statusBadge = pegar("statusBadge");
const livePill = pegar("livePill");
const connectionChip = pegar("connectionChip");
const progressFill = pegar("progressFill");
const currentTime = pegar("currentTime");
const durationTime = pegar("durationTime");
const startFloat = pegar("startFloat");
const playerCard = document.querySelector(".player-card");

// Controles que ficam dentro do flyer.
const flyerVolumeBtn = pegar("flyerVolumeBtn");
const flyerVolumeControl = pegar("flyerVolumeControl");
const flyerFrame = pegar("flyerFrame");
const vinylHotspot = pegar("vinylHotspot");
const flyerChoiceMenu = pegar("flyerChoiceMenu");
const choiceIntroBtn = pegar("choiceIntroBtn");
const choiceRadioBtn = pegar("choiceRadioBtn");
const choicePauseBtn = pegar("choicePauseBtn");
const repriseFrame = pegar("repriseFrame");

// Selo dinâmico do flyer.
const aoVivoStamp = pegar("aoVivoStamp");
const aoVivoText = pegar("aoVivoText");

// Links flutuantes.
const linkButtons = document.querySelectorAll("[data-link]");

// Módulo antigo de estreia. Pode não existir.
const launchDatePanel = pegar("launchDatePanel");
const launchDay = pegar("launchDay");
const launchMonth = pegar("launchMonth");
const launchHour = pegar("launchHour");
const launchStatus = pegar("launchStatus");

// Contador dentro do flyer.
const countDays = pegar("countDays");
const countHours = pegar("countHours");
const countMinutes = pegar("countMinutes");
const countSeconds = pegar("countSeconds");
const countdownBox = pegar("countdownBox");

/* =========================================================
   4) VARIÁVEIS DE CONTROLE
   ========================================================= */

// Estados possíveis: parado, chamada, radio, pausado.
let estadoAtual = "parado";
let audioAtual = introAudio;
let hoverFechaTimer = null;
let repriseTocando = false;

// Volume inicial.
if (introAudio) introAudio.volume = 0.9;
if (streamAudio) streamAudio.volume = 0.9;

/* =========================================================
   5) FUNÇÕES DE STATUS / VISUAL
   ========================================================= */

function setConnection(texto, tipo) {
  if (!connectionChip) return;

  connectionChip.textContent = texto;
  connectionChip.className = "connection-chip";

  if (tipo) {
    connectionChip.classList.add(tipo);
  }
}

/*
  FUNÇÃO MAIS IMPORTANTE PARA O SELO DO FLYER.

  Estados disponíveis:
  - atualizarSeloAoVivo("pausado")     => PAUSADO
  - atualizarSeloAoVivo("vinheta")     => VINHETA
  - atualizarSeloAoVivo("conectando")  => CONECTANDO
  - atualizarSeloAoVivo("live")        => AO VIVO
  - atualizarSeloAoVivo("erro")        => ERRO
*/
function atualizarSeloAoVivo(status) {
  if (!aoVivoStamp || !aoVivoText) return;

  const opcoes = {
    live: {
      texto: "AO VIVO",
      classe: "is-live",
      aria: "Status da transmissão: rádio ao vivo"
    },
    vinheta: {
      texto: "CHAMADA",
      classe: "is-vinheta",
      aria: "Status da transmissão: vinheta tocando"
    },
    pausado: {
      texto: "PAUSADO",
      classe: "is-paused",
      aria: "Status da transmissão: pausado"
    },
    conectando: {
      texto: "CONECT",
      classe: "is-connecting",
      aria: "Status da transmissão: conectando rádio"
    },
    erro: {
      texto: "ERRO",
      classe: "is-error",
      aria: "Status da transmissão: erro no áudio"
    },
    reprise: {
      texto: "REPRISE",
      classe: "is-vinheta",
      aria: "Status da transmissão: reprise tocando"
    }
  };

  const config = opcoes[status] || opcoes.pausado;

  aoVivoStamp.classList.remove("is-live", "is-vinheta", "is-paused", "is-connecting", "is-error");
  aoVivoStamp.classList.add(config.classe);
  aoVivoText.textContent = config.texto;
  aoVivoStamp.setAttribute("aria-label", config.aria);
}

function setPlayerPlaying(ativo) {
  document.body.classList.toggle("playing", ativo);

  if (playerCard) {
    playerCard.classList.toggle("playing", ativo);
  }

  if (flyerFrame) {
    flyerFrame.classList.toggle("vinyl-active", ativo);
  }
}

function atualizarIconePlay(tocando) {
  escreverTexto(playIcon, tocando ? "❚❚" : "▶");
}

function atualizarBotoesVolume() {
  if (!introAudio || !streamAudio) return;

  const muted = introAudio.muted || streamAudio.muted;

  escreverTexto(muteBtn, muted ? "🔇" : "🔊");
  escreverTexto(headerVolumeBtn, muted ? "🔇 Volume" : "🔊 Volume");
  escreverTexto(flyerVolumeBtn, muted ? "🔇" : "🔊");
}

function atualizarPlayerOpcional(titulo, status, badge, badgeClass) {
  escreverTexto(trackTitle, titulo);
  escreverTexto(playerStatus, status);
  escreverTexto(statusBadge, badge);

  if (statusBadge && badgeClass) {
    statusBadge.className = badgeClass;
  }
}

function atualizarProgressoVisual(largura, atual, duracao) {
  if (progressFill) progressFill.style.width = largura;
  escreverTexto(currentTime, atual);
  escreverTexto(durationTime, duracao);
}

/* =========================================================
   6) FUNÇÕES DE LINKS E MENU DO FLYER
   ========================================================= */

function abrirLink(nomeDoLink) {
  const url = LINKS[nomeDoLink];
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}

function abrirMenuFlyer() {
  clearTimeout(hoverFechaTimer);

  adicionarClasse(flyerChoiceMenu, "open");

  if (estadoAtual === "parado" || estadoAtual === "pausado") {
    atualizarPlayerOpcional(
      "Escolha uma opção",
      "Escolha Rádio, Chamada ou Reprise no flyer.",
      "ESCOLHA",
      "status-badge"
    );
  }
}

function fecharMenuFlyer() {
  removerClasse(flyerChoiceMenu, "open");
}

function agendarFechamentoMenu() {
  clearTimeout(hoverFechaTimer);

  hoverFechaTimer = setTimeout(function () {
    fecharMenuFlyer();
  }, 260);
}

/* =========================================================
   7) FUNÇÕES DE TEMPO E PROGRESSO
   ========================================================= */

function formatarTempo(segundos) {
  if (!segundos || isNaN(segundos) || segundos === Infinity) {
    return "00:00";
  }

  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = Math.floor(segundos % 60);

  return String(minutos).padStart(2, "0") + ":" + String(segundosRestantes).padStart(2, "0");
}

function atualizarProgresso(audio) {
  if (!progressFill && !currentTime && !durationTime) return;

  if (!audio || !audio.duration || isNaN(audio.duration) || audio.duration === Infinity) {
    atualizarProgressoVisual("100%", "AO VIVO", "AO VIVO");
    return;
  }

  const porcentagem = (audio.currentTime / audio.duration) * 100;

  atualizarProgressoVisual(
    porcentagem + "%",
    formatarTempo(audio.currentTime),
    formatarTempo(audio.duration)
  );
}

function prepararStream() {
  if (!streamAudio) return;

  if (!streamAudio.src || !streamAudio.src.includes(STREAM)) {
    streamAudio.src = STREAM;
  }
}

/* =========================================================
   8) FUNÇÕES DE REPRODUÇÃO DE ÁUDIO
   ========================================================= */

function controlarRepriseYouTube(acao) {
  if (!repriseFrame || !repriseFrame.contentWindow) return;

  repriseFrame.contentWindow.postMessage(
    JSON.stringify({
      event: "command",
      func: acao === "play" ? "playVideo" : "pauseVideo",
      args: []
    }),
    "*"
  );
}

function pausarReprise() {
  if (!repriseTocando) return;
  controlarRepriseYouTube("pause");
  repriseTocando = false;
}

function tocarReprise() {
  fecharMenuFlyer();

  if (repriseTocando) {
    pausarReprise();
    estadoAtual = "pausado";
    setPlayerPlaying(false);
    atualizarIconePlay(false);
    atualizarSeloAoVivo("pausado");
    setConnection("PAUSADO", "offline");
    atualizarPlayerOpcional("Reprise", "Reprise pausada.", "PAUSADO", "status-badge");
    return;
  }

  if (introAudio) introAudio.pause();
  if (streamAudio) streamAudio.pause();
  pausarReprise();

  repriseTocando = true;
  estadoAtual = "reprise";
  audioAtual = null;

  controlarRepriseYouTube("play");

  setPlayerPlaying(true);
  atualizarIconePlay(true);
  atualizarSeloAoVivo("reprise");
  setConnection("REPRISE", "connected");
  removerClasse(livePill, "active");

  atualizarPlayerOpcional(
    "Reprise Experiência Black",
    "Reprise oficial em reprodução.",
    "REPRISE",
    "status-badge live"
  );
}

function alternarRadio() {
  if (estadoAtual === "radio" && streamAudio && !streamAudio.paused) {
    pausarTudo();
    return;
  }

  tocarRadio();
}

function alternarChamada() {
  if (estadoAtual === "chamada" && introAudio && !introAudio.paused) {
    pausarTudo();
    return;
  }

  tocarChamada();
}

function tocarChamada() {
  if (!introAudio || !streamAudio) return;

  fecharMenuFlyer();
  pausarReprise();
  streamAudio.pause();

  // REV11 - correção cirúrgica do botão Chamada:
  // garante que a vinheta local esteja carregada e reinicie do começo.
  if (!introAudio.getAttribute("src")) {
    introAudio.setAttribute("src", "assets/audio/chamada.mp3");
  }

  audioAtual = introAudio;
  estadoAtual = "chamada";

  try {
    introAudio.pause();
    introAudio.currentTime = 0;
    introAudio.load();
  } catch (erro) {
    // Alguns navegadores podem bloquear mudança de tempo antes do áudio carregar.
  }

  atualizarPlayerOpcional(
    "Chamada de abertura",
    "Chamada oficial em reprodução. A rádio entra automaticamente ao final.",
    "CHAMADA",
    "status-badge"
  );

  removerClasse(livePill, "active");
  atualizarSeloAoVivo("vinheta");
  setConnection("PREPARANDO", "pending");
  setPlayerPlaying(true);
  atualizarIconePlay(true);
  adicionarClasse(startFloat, "hide");

  const tentativa = introAudio.play();

  if (tentativa && typeof tentativa.catch === "function") {
    tentativa.catch(function () {
      estadoAtual = "parado";
      setPlayerPlaying(false);
      atualizarIconePlay(false);
      atualizarSeloAoVivo("erro");
      setConnection("DESCONECTADO", "offline");

      atualizarPlayerOpcional(
        "Chamada de abertura",
        "Não foi possível tocar a chamada. Toque novamente.",
        "ERRO CHAMADA",
        "status-badge warning"
      );
    });
  }
}

function tocarRadio() {
  if (!streamAudio || !introAudio) return;

  fecharMenuFlyer();
  pausarReprise();

  if (RADIO_STATUS === "offline") {
    abrirLink("radioOffline");
    atualizarSeloAoVivo("pausado");
    return;
  }

  prepararStream();
  introAudio.pause();

  audioAtual = streamAudio;
  estadoAtual = "radio";

  atualizarPlayerOpcional(
    "Rádio Black in Love",
    "Conectando transmissão ao vivo...",
    "CONECTANDO",
    "status-badge"
  );

  atualizarSeloAoVivo("conectando");
  setConnection("CONECTANDO", "pending");
  setPlayerPlaying(true);
  atualizarIconePlay(true);
  adicionarClasse(startFloat, "hide");

  const tentativa = streamAudio.play();

  if (tentativa && typeof tentativa.catch === "function") {
    tentativa.catch(function () {
      estadoAtual = "parado";
      setPlayerPlaying(false);
      atualizarIconePlay(false);
      removerClasse(livePill, "active");
      atualizarSeloAoVivo("erro");
      setConnection("DESCONECTADO", "offline");

      atualizarPlayerOpcional(
        "Rádio Black in Love",
        "Não foi possível iniciar a rádio. Toque novamente.",
        "ERRO RÁDIO",
        "status-badge warning"
      );
    });
  }
}

function pausarTudo() {
  if (introAudio) introAudio.pause();
  if (streamAudio) streamAudio.pause();
  pausarReprise();

  estadoAtual = "pausado";

  setPlayerPlaying(false);
  atualizarIconePlay(false);
  removerClasse(livePill, "active");
  atualizarSeloAoVivo("pausado");
  setConnection("PAUSADO", "offline");
  fecharMenuFlyer();

  if (audioAtual === streamAudio) {
    atualizarPlayerOpcional("Rádio Black in Love", "Rádio pausada.", "PAUSADO", "status-badge");
  } else {
    atualizarPlayerOpcional("Chamada de abertura", "Chamada pausada.", "PAUSADO", "status-badge");
  }
}

function iniciarExperiencia() {
  abrirMenuFlyer();
}

/* =========================================================
   9) FUNÇÕES DE VOLUME
   ========================================================= */

function alternarMute() {
  if (!introAudio || !streamAudio) return;

  const novoEstado = !(introAudio.muted || streamAudio.muted);

  introAudio.muted = novoEstado;
  streamAudio.muted = novoEstado;

  atualizarBotoesVolume();
}

function aplicarVolume(valor) {
  if (!introAudio || !streamAudio) return;

  introAudio.volume = valor;
  streamAudio.volume = valor;

  if (volumeControl) volumeControl.value = valor;
  if (flyerVolumeControl) flyerVolumeControl.value = valor;
}

/* =========================================================
   10) FUNÇÕES DO CONTADOR / ESTREIA
   ========================================================= */

function renderSegmentNumber(element, value, label) {
  if (!element) return;

  const normalized = String(value).padStart(2, "0").slice(-2);
  element.dataset.value = normalized;
  element.setAttribute("aria-label", label || normalized);
  element.textContent = normalized;
}

function obterDataEstreia() {
  return new Date(
    CONFIG_ESTREIA.ano,
    CONFIG_ESTREIA.mes - 1,
    CONFIG_ESTREIA.dia,
    CONFIG_ESTREIA.hora,
    CONFIG_ESTREIA.minuto,
    0
  );
}

function atualizarModuloEstreia() {
  if (!launchDatePanel || !launchStatus) return;

  const dataEstreia = obterDataEstreia();
  const agora = new Date();
  const diferenca = dataEstreia.getTime() - agora.getTime();

  renderSegmentNumber(launchDay, CONFIG_ESTREIA.dia, `Dia ${String(CONFIG_ESTREIA.dia).padStart(2, "0")}`);
  renderSegmentNumber(launchMonth, CONFIG_ESTREIA.mes, `Mês ${String(CONFIG_ESTREIA.mes).padStart(2, "0")}`);
  renderSegmentNumber(launchHour, CONFIG_ESTREIA.hora, `${String(CONFIG_ESTREIA.hora).padStart(2, "0")} horas`);

  launchDatePanel.classList.remove("is-live", "is-premiere");

  if (diferenca > 0) {
    launchStatus.textContent = "ESTREIA OFICIAL";
    return;
  }

  const janelaEstreiaMs = 10 * 60 * 1000;

  if (Math.abs(diferenca) <= janelaEstreiaMs) {
    launchDatePanel.classList.add("is-premiere");
    launchStatus.textContent = "ESTREIA OFICIAL";
    return;
  }

  launchDatePanel.classList.add("is-live");
  launchStatus.textContent = "AO VIVO";
}

function preencherContador(elemento, valor) {
  if (!elemento) return;
  elemento.textContent = String(valor).padStart(2, "0");
}

function atualizarContagemRegressivaV10() {
  if (!countDays || !countHours || !countMinutes || !countSeconds) return;

  const dataEstreia = obterDataEstreia();
  const agora = new Date();
  const diferenca = dataEstreia.getTime() - agora.getTime();

  if (diferenca <= 0) {
    preencherContador(countDays, 0);
    preencherContador(countHours, 0);
    preencherContador(countMinutes, 0);
    preencherContador(countSeconds, 0);

    if (countdownBox) {
      countdownBox.classList.add("countdown-live");
      const dataTexto = countdownBox.querySelector(".countdown-date");
      const tituloTexto = countdownBox.querySelector(".countdown-kicker");
      escreverTexto(tituloTexto, "COMEÇOU");
      escreverHtml(dataTexto, "NO AR <span>AGORA</span>");
    }
    return;
  }

  if (countdownBox) {
    countdownBox.classList.remove("countdown-live");
    const dataTexto = countdownBox.querySelector(".countdown-date");
    const tituloTexto = countdownBox.querySelector(".countdown-kicker");
    escreverTexto(tituloTexto, "FALTAM");
    escreverHtml(dataTexto, "12/07 <span>12HS</span>");
  }

  const totalSegundos = Math.floor(diferenca / 1000);
  const dias = Math.floor(totalSegundos / 86400);
  const horas = Math.floor((totalSegundos % 86400) / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;

  preencherContador(countDays, dias);
  preencherContador(countHours, horas);
  preencherContador(countMinutes, minutos);
  preencherContador(countSeconds, segundos);
}

/* =========================================================
   11) EVENTOS DE CLIQUE
   ========================================================= */

escutar(mainPlayBtn, "click", function () {
  if (estadoAtual === "chamada" || estadoAtual === "radio") {
    pausarTudo();
    return;
  }

  iniciarExperiencia();
});

escutar(startFloat, "click", function () {
  iniciarExperiencia();
});

escutar(choiceIntroBtn, "click", function (event) {
  event.stopPropagation();
  alternarChamada();
});

escutar(choiceRadioBtn, "click", function (event) {
  event.stopPropagation();
  alternarRadio();
});

escutar(choicePauseBtn, "click", function (event) {
  event.stopPropagation();
  tocarReprise();
});

escutar(muteBtn, "click", alternarMute);
escutar(headerVolumeBtn, "click", alternarMute);

escutar(flyerVolumeBtn, "click", function (event) {
  event.stopPropagation();
  alternarMute();
});

escutar(volumeControl, "input", function () {
  aplicarVolume(Number(volumeControl.value));
});

escutar(flyerVolumeControl, "click", function (event) {
  event.stopPropagation();
});

escutar(flyerVolumeControl, "input", function () {
  aplicarVolume(Number(flyerVolumeControl.value));
});

escutar(vinylHotspot, "click", function (event) {
  event.stopPropagation();
  abrirMenuFlyer();
});

if (window.matchMedia("(hover: hover)").matches) {
  escutar(vinylHotspot, "mouseenter", abrirMenuFlyer);

  escutar(flyerChoiceMenu, "mouseenter", function () {
    clearTimeout(hoverFechaTimer);
  });

  escutar(vinylHotspot, "mouseleave", agendarFechamentoMenu);
  escutar(flyerChoiceMenu, "mouseleave", agendarFechamentoMenu);
}

linkButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    event.stopPropagation();
    abrirLink(button.dataset.link);
  });
});

document.addEventListener("click", function (event) {
  const clicouNoMenu = contem(flyerChoiceMenu, event.target);
  const clicouNoVinyl = contem(vinylHotspot, event.target);
  const clicouNoBotaoStart = contem(startFloat, event.target);
  const clicouNoBotaoPlay = contem(mainPlayBtn, event.target);

  if (!clicouNoMenu && !clicouNoVinyl && !clicouNoBotaoStart && !clicouNoBotaoPlay) {
    fecharMenuFlyer();
  }
});

/* =========================================================
   12) EVENTOS DO ÁUDIO DA CHAMADA / VINHETA
   ========================================================= */

escutar(introAudio, "loadedmetadata", function () {
  escreverTexto(durationTime, formatarTempo(introAudio.duration));
});

escutar(introAudio, "timeupdate", function () {
  if (estadoAtual === "chamada") {
    atualizarProgresso(introAudio);
  }
});

escutar(introAudio, "ended", function () {
  atualizarProgressoVisual("0%", "00:00", "00:00");
  estadoAtual = "parado";
  setPlayerPlaying(false);
  atualizarIconePlay(false);
  atualizarSeloAoVivo("pausado");
  setConnection("PAUSADO", "offline");

  atualizarPlayerOpcional(
    "Chamada de abertura",
    "Chamada finalizada. Toque novamente para repetir.",
    "FINALIZADA",
    "status-badge"
  );
});

escutar(introAudio, "error", function () {
  estadoAtual = "parado";
  setPlayerPlaying(false);
  atualizarIconePlay(false);
  atualizarSeloAoVivo("erro");
  setConnection("DESCONECTADO", "offline");

  atualizarPlayerOpcional(
    "Chamada de abertura",
    "Erro ao carregar a chamada. Verifique o arquivo assets/audio/chamada.mp3.",
    "ERRO CHAMADA",
    "status-badge warning"
  );
});

/* =========================================================
   13) EVENTOS DO ÁUDIO DA RÁDIO AO VIVO
   ========================================================= */

escutar(streamAudio, "playing", function () {
  estadoAtual = "radio";
  audioAtual = streamAudio;

  atualizarPlayerOpcional(
    "Rádio Black in Love",
    "Transmissão ao vivo em reprodução.",
    "AO VIVO",
    "status-badge live"
  );

  adicionarClasse(livePill, "active");
  atualizarSeloAoVivo("live");
  setConnection("CONECTADO", "connected");
  setPlayerPlaying(true);
  atualizarIconePlay(true);
  atualizarProgressoVisual("100%", "AO VIVO", "AO VIVO");
});

escutar(streamAudio, "timeupdate", function () {
  if (estadoAtual === "radio") {
    atualizarProgresso(streamAudio);
  }
});

escutar(streamAudio, "pause", function () {
  if (estadoAtual === "radio") {
    estadoAtual = "pausado";
    setPlayerPlaying(false);
    atualizarIconePlay(false);
    removerClasse(livePill, "active");
    atualizarSeloAoVivo("pausado");
    setConnection("PAUSADO", "offline");
  }
});

escutar(streamAudio, "error", function () {
  estadoAtual = "parado";
  setPlayerPlaying(false);
  atualizarIconePlay(false);
  removerClasse(livePill, "active");
  atualizarSeloAoVivo("erro");
  setConnection("DESCONECTADO", "offline");

  atualizarPlayerOpcional(
    "Rádio Black in Love",
    "Erro ao carregar a rádio. Verifique conexão ou liberação do navegador para áudio.",
    "ERRO RÁDIO",
    "status-badge warning"
  );
});

/* =========================================================
   14) ESTADO INICIAL DO SITE
   ========================================================= */

atualizarPlayerOpcional(
  "Escolha uma opção",
  "Toque no vinil e escolha Rádio, Chamada ou Reprise.",
  "PRONTO",
  "status-badge"
);

atualizarProgressoVisual("0%", "00:00", "00:00");
setConnection("DESCONECTADO", "offline");
atualizarBotoesVolume();
atualizarModuloEstreia();
setInterval(atualizarModuloEstreia, 30000);
atualizarContagemRegressivaV10();
setInterval(atualizarContagemRegressivaV10, 1000);
atualizarSeloAoVivo("pausado");

(function () {
  const canvas = document.getElementById("blackrootSpectrum");
  const intro = document.getElementById("introAudio");
  const stream = document.getElementById("streamAudio");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let rodando = false;
  let audioCtx = null;
  let analyser = null;
  let freqData = null;
  let fonteIntro = null;
  let fonteStream = null;
  let energiaSuavizada = 0;
  let semLeituraAudio = 0;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function limpar() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function audioTocando() {
    return (intro && !intro.paused) || (stream && !stream.paused);
  }

  function prepararAudioReal() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioCtx) audioCtx = new AudioContextClass();

      if (!analyser) {
        analyser = audioCtx.createAnalyser();

        // REV10 - correção cirúrgica:
        // Mantém o espectro rítmico, mas não deixa o WebAudio bloquear/silenciar
        // os botões Rádio e Chamada.
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.72;
        analyser.connect(audioCtx.destination);
      }

      if (!freqData) freqData = new Uint8Array(analyser.frequencyBinCount);

      // A chamada é arquivo local do projeto, então pode alimentar o espectro real com segurança.
      if (intro && !fonteIntro) {
        try {
          fonteIntro = audioCtx.createMediaElementSource(intro);
          fonteIntro.connect(analyser);
        } catch (erroIntro) {
          fonteIntro = null;
        }
      }

      // IMPORTANTE:
      // Não conectamos o stream externo da rádio ao createMediaElementSource.
      // Alguns servidores de rádio não liberam CORS e o navegador pode transformar o áudio em silêncio.
      // Assim preservamos o funcionamento dos botões Rádio/Chamada; no stream o espectro usa fallback visual.

      if (audioCtx.state === "suspended") audioCtx.resume().catch(function () {});
    } catch (erro) {
      audioCtx = null;
      analyser = null;
      freqData = null;
      fonteIntro = null;
    }
  }

  function obterEnergiaReal(inicio, fim) {
    if (!analyser || !freqData) return 0;

    analyser.getByteFrequencyData(freqData);

    let soma = 0;
    let total = 0;
    const ini = Math.max(0, Math.floor(inicio));
    const ate = Math.min(freqData.length - 1, Math.floor(fim));

    for (let i = ini; i <= ate; i++) {
      soma += freqData[i];
      total++;
    }

    return total ? soma / (total * 255) : 0;
  }

  function desenhar() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!audioTocando()) {
      requestAnimationFrame(desenhar);
      return;
    }

    prepararAudioReal();

    /*
      REV9 - ESPECTRO BLACKROOT COM RITMO REAL
      Alteração cirúrgica: mantém o desenho aprovado da REV8,
      mas agora as barras usam frequência/volume real do áudio.
    */
    const tempo = Date.now() * 0.0048;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const totalBarsSide = 34;
    const gap = canvas.width / (totalBarsSide * 2 + 8);
    const barWidth = Math.max(2, gap * 0.34);
    const maxHeight = canvas.height * 0.44;

    const grave = obterEnergiaReal(2, 18);
    const medio = obterEnergiaReal(19, 72);
    const agudo = obterEnergiaReal(73, 180);
    const energiaReal = Math.min(1, grave * 0.55 + medio * 0.34 + agudo * 0.20);

    if (energiaReal < 0.012) semLeituraAudio++;
    else semLeituraAudio = 0;

    const fallback = semLeituraAudio > 25;
    const pulsoBase = fallback
      ? (0.42 + Math.abs(Math.sin(tempo * 0.95)) * 0.42)
      : Math.min(1, energiaReal * 1.85);

    energiaSuavizada = energiaSuavizada * 0.74 + pulsoBase * 0.26;

    ctx.save();

    const baseGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    baseGradient.addColorStop(0, "rgba(255, 176, 0, 0)");
    baseGradient.addColorStop(0.18, "rgba(255, 176, 0, 0.45)");
    baseGradient.addColorStop(0.50, "rgba(255, 238, 168, 0.95)");
    baseGradient.addColorStop(0.82, "rgba(255, 176, 0, 0.45)");
    baseGradient.addColorStop(1, "rgba(255, 176, 0, 0)");

    ctx.shadowColor = "rgba(255, 176, 0, 0.95)";
    ctx.shadowBlur = 10 + energiaSuavizada * 18;
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, centerY - 1, canvas.width, 2);

    ctx.shadowBlur = 18 + energiaSuavizada * 28;
    ctx.fillStyle = "rgba(255, 238, 168, 0.96)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.8 + energiaSuavizada * 3.1, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < totalBarsSide; i++) {
      const dist = i / totalBarsSide;
      const envelope = Math.sin((1 - dist) * Math.PI * 0.92);

      let faixa = 0;
      if (!fallback && analyser && freqData) {
        const idx = Math.floor(4 + dist * 165);
        const vizinhoA = freqData[Math.max(0, idx - 1)] || 0;
        const centro = freqData[idx] || 0;
        const vizinhoB = freqData[Math.min(freqData.length - 1, idx + 1)] || 0;
        faixa = (vizinhoA * 0.25 + centro * 0.50 + vizinhoB * 0.25) / 255;
      } else {
        const waveA = Math.abs(Math.sin(tempo + i * 0.62));
        const waveB = Math.abs(Math.cos(tempo * 1.55 + i * 0.37));
        faixa = waveA * 0.68 + waveB * 0.32;
      }

      const impacto = Math.min(1, faixa * 1.55 + energiaSuavizada * 0.55);
      const h = 3 + maxHeight * envelope * (0.18 + impacto * 1.04);

      const offset = (i + 1.25) * gap;
      const xLeft = centerX - offset;
      const xRight = centerX + offset - barWidth;

      const grad = ctx.createLinearGradient(0, centerY - h, 0, centerY + h);
      grad.addColorStop(0, "rgba(255, 208, 72, 0.07)");
      grad.addColorStop(0.22, "rgba(255, 176, 0, 0.94)");
      grad.addColorStop(0.50, "rgba(255, 242, 178, 1)");
      grad.addColorStop(0.78, "rgba(255, 176, 0, 0.94)");
      grad.addColorStop(1, "rgba(255, 208, 72, 0.07)");

      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(255, 176, 0, 0.88)";
      ctx.shadowBlur = 10 + impacto * 16;

      roundBar(xLeft, centerY - h, barWidth, h * 2, barWidth / 2);
      roundBar(xRight, centerY - h, barWidth, h * 2, barWidth / 2);
    }

    ctx.restore();
    requestAnimationFrame(desenhar);
  }

  function roundBar(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  function iniciarSpectrum() {
    prepararAudioReal();
    if (rodando) return;
    rodando = true;
    desenhar();
  }

  [intro, stream].forEach(function (audio) {
    if (!audio) return;

    audio.addEventListener("play", iniciarSpectrum);
    audio.addEventListener("playing", iniciarSpectrum);
    audio.addEventListener("pause", limpar);
    audio.addEventListener("ended", limpar);
  });
})();
/* =========================================================
   REV13 - CORREÇÃO CIRÚRGICA DOS 3 BOTÕES DO VINIL
   Escopo: somente Rádio / Chamada / Reprise.
   ========================================================= */

function rev13PararAudiosMenos(tipo) {
  if (tipo !== "chamada" && introAudio) {
    try { introAudio.pause(); } catch (erro) {}
  }

  if (tipo !== "radio" && streamAudio) {
    try { streamAudio.pause(); } catch (erro) {}
  }

  if (tipo !== "reprise") {
    rev13PausarRepriseDireto();
  }
}

function rev13PausarRepriseDireto() {
  repriseTocando = false;

  if (!repriseFrame) return;

  try {
    if (repriseFrame.contentWindow) {
      repriseFrame.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
        "*"
      );
    }
  } catch (erro) {}

  /*
    Garantia prática: remover o src pausa o áudio do YouTube mesmo quando
    o player não aceita postMessage por bloqueio do navegador.
  */
  try {
    repriseFrame.setAttribute("src", "about:blank");
  } catch (erro) {}
}

function pausarReprise() {
  rev13PausarRepriseDireto();
}

function alternarRadio() {
  fecharMenuFlyer();

  if (estadoAtual === "radio" && streamAudio && !streamAudio.paused) {
    pausarTudo();
    return;
  }

  tocarRadio();
}

function alternarChamada() {
  fecharMenuFlyer();

  if (estadoAtual === "chamada" && introAudio && !introAudio.paused) {
    pausarTudo();
    return;
  }

  tocarChamada();
}

function tocarChamada() {
  if (!introAudio) return;

  fecharMenuFlyer();
  rev13PararAudiosMenos("chamada");

  audioAtual = introAudio;
  estadoAtual = "chamada";

  try {
    introAudio.pause();
    introAudio.src = "assets/audio/chamada.mp3";
    introAudio.load();
    introAudio.currentTime = 0;
  } catch (erro) {}

  atualizarPlayerOpcional(
    "Chamada de abertura",
    "Chamada oficial em reprodução.",
    "CHAMADA",
    "status-badge"
  );

  removerClasse(livePill, "active");
  atualizarSeloAoVivo("vinheta");
  setConnection("CHAMADA", "pending");
  setPlayerPlaying(true);
  atualizarIconePlay(true);
  adicionarClasse(startFloat, "hide");

  const tentativa = introAudio.play();

  if (tentativa && typeof tentativa.catch === "function") {
    tentativa.catch(function () {
      estadoAtual = "parado";
      setPlayerPlaying(false);
      atualizarIconePlay(false);
      atualizarSeloAoVivo("erro");
      setConnection("DESCONECTADO", "offline");

      atualizarPlayerOpcional(
        "Chamada de abertura",
        "Não foi possível tocar a chamada. Clique novamente.",
        "ERRO CHAMADA",
        "status-badge warning"
      );
    });
  }
}

function tocarReprise() {
  fecharMenuFlyer();

  if (estadoAtual === "reprise" && repriseTocando) {
    pausarTudo();
    return;
  }

  rev13PararAudiosMenos("reprise");

  repriseTocando = true;
  estadoAtual = "reprise";
  audioAtual = null;

  /*
    Mais confiável que tentar tocar um iframe já carregado:
    no clique do usuário, carregamos o vídeo já com autoplay.
  */
  if (repriseFrame) {
    repriseFrame.setAttribute(
      "src",
      "https://www.youtube.com/embed/hylxoxVXkeM?enablejsapi=1&playsinline=1&autoplay=1&rel=0"
    );
  }

  setPlayerPlaying(true);
  atualizarIconePlay(true);
  atualizarSeloAoVivo("reprise");
  setConnection("REPRISE", "connected");
  removerClasse(livePill, "active");

  atualizarPlayerOpcional(
    "Reprise Experiência Black",
    "Reprise oficial em reprodução.",
    "REPRISE",
    "status-badge live"
  );
}

function pausarTudo() {
  if (introAudio) {
    try { introAudio.pause(); } catch (erro) {}
  }

  if (streamAudio) {
    try { streamAudio.pause(); } catch (erro) {}
  }

  rev13PausarRepriseDireto();

  estadoAtual = "pausado";
  repriseTocando = false;

  setPlayerPlaying(false);
  atualizarIconePlay(false);
  removerClasse(livePill, "active");
  atualizarSeloAoVivo("pausado");
  setConnection("PAUSADO", "offline");
  fecharMenuFlyer();

  atualizarPlayerOpcional("Experiência Black", "Reprodução pausada.", "PAUSADO", "status-badge");
}

/* =========================================================
   REV14 - BOTÕES DO VINIL REFEITOS SEM HERDAR EVENTOS ANTIGOS
   Escopo único: Rádio / Chamada / Reprise.
   Motivo: garantir clique/pausa sem interferência do espectro.
   ========================================================= */
(function () {
  const YOUTUBE_REPRISE = "https://www.youtube.com/embed/hylxoxVXkeM?enablejsapi=1&playsinline=1&autoplay=1&rel=0";

  function byId(id) {
    return document.getElementById(id);
  }

  function trocarBotao(id) {
    const antigo = byId(id);
    if (!antigo || !antigo.parentNode) return null;
    const novo = antigo.cloneNode(true);
    antigo.parentNode.replaceChild(novo, antigo);
    return novo;
  }

  const btnRadioRev14 = trocarBotao("choiceRadioBtn");
  const btnChamadaRev14 = trocarBotao("choiceIntroBtn");
  const btnRepriseRev14 = trocarBotao("choicePauseBtn");

  const audioChamadaRev14 = byId("introAudio");
  const audioRadioRev14 = byId("streamAudio");
  const iframeRepriseRev14 = byId("repriseFrame");

  let repriseAtivaRev14 = false;

  function pararChamadaRev14() {
    if (!audioChamadaRev14) return;
    try { audioChamadaRev14.pause(); } catch (e) {}
  }

  function pararRadioRev14() {
    if (!audioRadioRev14) return;
    try { audioRadioRev14.pause(); } catch (e) {}
  }

  function pararRepriseRev14() {
    repriseAtivaRev14 = false;
    try {
      if (iframeRepriseRev14 && iframeRepriseRev14.contentWindow) {
        iframeRepriseRev14.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    } catch (e) {}
    try {
      if (iframeRepriseRev14) iframeRepriseRev14.setAttribute("src", "about:blank");
    } catch (e) {}
  }

  function pararTudoRev14() {
    pararChamadaRev14();
    pararRadioRev14();
    pararRepriseRev14();

    estadoAtual = "pausado";
    repriseTocando = false;
    audioAtual = null;

    if (typeof setPlayerPlaying === "function") setPlayerPlaying(false);
    if (typeof atualizarIconePlay === "function") atualizarIconePlay(false);
    if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("pausado");
    if (typeof setConnection === "function") setConnection("PAUSADO", "offline");
    if (typeof fecharMenuFlyer === "function") fecharMenuFlyer();
  }

  function tocarChamadaRev14() {
    if (!audioChamadaRev14) return;

    pararRadioRev14();
    pararRepriseRev14();

    try {
      audioChamadaRev14.src = "assets/audio/chamada.mp3";
      audioChamadaRev14.currentTime = 0;
      audioChamadaRev14.volume = 1;
    } catch (e) {}

    estadoAtual = "chamada";
    audioAtual = audioChamadaRev14;

    if (typeof setPlayerPlaying === "function") setPlayerPlaying(true);
    if (typeof atualizarIconePlay === "function") atualizarIconePlay(true);
    if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("vinheta");
    if (typeof setConnection === "function") setConnection("CHAMADA", "pending");
    if (typeof atualizarPlayerOpcional === "function") {
      atualizarPlayerOpcional("Chamada de abertura", "Chamada oficial em reprodução.", "CHAMADA", "status-badge");
    }
    if (typeof fecharMenuFlyer === "function") fecharMenuFlyer();

    const playPromise = audioChamadaRev14.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        if (typeof atualizarPlayerOpcional === "function") {
          atualizarPlayerOpcional("Chamada", "Navegador bloqueou o áudio. Clique novamente.", "ERRO", "status-badge warning");
        }
      });
    }
  }

  function tocarRepriseRev14() {
    pararChamadaRev14();
    pararRadioRev14();

    repriseAtivaRev14 = true;
    repriseTocando = true;
    estadoAtual = "reprise";
    audioAtual = null;

    if (iframeRepriseRev14) {
      iframeRepriseRev14.setAttribute("src", YOUTUBE_REPRISE + "&t=" + Date.now());
    }

    if (typeof setPlayerPlaying === "function") setPlayerPlaying(true);
    if (typeof atualizarIconePlay === "function") atualizarIconePlay(true);
    if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("reprise");
    if (typeof setConnection === "function") setConnection("REPRISE", "connected");
    if (typeof atualizarPlayerOpcional === "function") {
      atualizarPlayerOpcional("Reprise Experiência Black", "Reprise oficial em reprodução.", "REPRISE", "status-badge live");
    }
    if (typeof fecharMenuFlyer === "function") fecharMenuFlyer();
  }

  if (btnRadioRev14) {
    btnRadioRev14.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (estadoAtual === "radio" && audioRadioRev14 && !audioRadioRev14.paused) {
        pararTudoRev14();
        return;
      }

      pararChamadaRev14();
      pararRepriseRev14();
      tocarRadio();
    });
  }

  if (btnChamadaRev14) {
    btnChamadaRev14.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (estadoAtual === "chamada" && audioChamadaRev14 && !audioChamadaRev14.paused) {
        pararTudoRev14();
        return;
      }

      tocarChamadaRev14();
    });
  }

  if (btnRepriseRev14) {
    btnRepriseRev14.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (estadoAtual === "reprise" && repriseAtivaRev14) {
        pararTudoRev14();
        return;
      }

      tocarRepriseRev14();
    });
  }

  if (audioChamadaRev14) {
    audioChamadaRev14.addEventListener("ended", function () {
      if (estadoAtual === "chamada") {
        pararTudoRev14();
      }
    });
  }
})();

/* =========================================================
   REV15 - CONTROLE FINAL ISOLADO DOS BOTÕES DO VINIL
   Escopo único: Rádio / Chamada / Reprise.
   - Rádio: usa streamAudio existente.
   - Chamada: usa o arquivo local assets/audio/chamada.mp3 com load() antes do play().
   - Reprise: usa YouTube embed no clique do usuário.
   Observação técnica: YouTube pode bloquear áudio em iframe oculto dependendo do navegador.
   ========================================================= */
(function () {
  const CHAMADA_SRC_REV15 = "assets/audio/chamada.mp3";
  const REPRISE_SRC_REV15 = "https://www.youtube.com/embed/hylxoxVXkeM?enablejsapi=1&playsinline=1&autoplay=1&rel=0";

  function idRev15(id) { return document.getElementById(id); }

  function substituirBotaoRev15(id) {
    const antigo = idRev15(id);
    if (!antigo || !antigo.parentNode) return null;
    const novo = antigo.cloneNode(true);
    antigo.parentNode.replaceChild(novo, antigo);
    return novo;
  }

  const btnRadio = substituirBotaoRev15("choiceRadioBtn");
  const btnChamada = substituirBotaoRev15("choiceIntroBtn");
  const btnReprise = substituirBotaoRev15("choicePauseBtn");

  const audioRadio = idRev15("streamAudio");
  const audioChamada = idRev15("introAudio");
  const frameReprise = idRev15("repriseFrame");

  let modoRev15 = "parado";
  let repriseLigadaRev15 = false;

  function fecharMenuRev15() {
    try {
      if (typeof fecharMenuFlyer === "function") fecharMenuFlyer();
      const menu = idRev15("flyerChoiceMenu");
      if (menu) menu.classList.remove("open");
    } catch (e) {}
  }

  function uiTocandoRev15(titulo, desc, status, selo) {
    try { if (typeof setPlayerPlaying === "function") setPlayerPlaying(true); } catch (e) {}
    try { if (typeof atualizarIconePlay === "function") atualizarIconePlay(true); } catch (e) {}
    try { if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo(selo || "reproduzindo"); } catch (e) {}
    try { if (typeof setConnection === "function") setConnection(status || "TOCANDO", "connected"); } catch (e) {}
    try { if (typeof atualizarPlayerOpcional === "function") atualizarPlayerOpcional(titulo, desc, status, "status-badge live"); } catch (e) {}
  }

  function uiPausadoRev15() {
    try { if (typeof setPlayerPlaying === "function") setPlayerPlaying(false); } catch (e) {}
    try { if (typeof atualizarIconePlay === "function") atualizarIconePlay(false); } catch (e) {}
    try { if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("pausado"); } catch (e) {}
    try { if (typeof setConnection === "function") setConnection("PAUSADO", "offline"); } catch (e) {}
    try { if (typeof atualizarPlayerOpcional === "function") atualizarPlayerOpcional("Experiência Black", "Reprodução pausada.", "PAUSADO", "status-badge"); } catch (e) {}
  }

  function pararRepriseRev15() {
    repriseLigadaRev15 = false;
    try {
      if (frameReprise && frameReprise.contentWindow) {
        frameReprise.contentWindow.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
      }
    } catch (e) {}
    try { if (frameReprise) frameReprise.setAttribute("src", "about:blank"); } catch (e) {}
  }

  function pararRadioRev15() {
    try { if (audioRadio) audioRadio.pause(); } catch (e) {}
  }

  function pararChamadaRev15() {
    try { if (audioChamada) audioChamada.pause(); } catch (e) {}
  }

  function pararTudoRev15() {
    pararRadioRev15();
    pararChamadaRev15();
    pararRepriseRev15();
    modoRev15 = "pausado";
    try { estadoAtual = "pausado"; } catch (e) {}
    try { audioAtual = null; } catch (e) {}
    uiPausadoRev15();
    fecharMenuRev15();
  }

  function tocarRadioRev15() {
    if (!audioRadio) return;

    pararChamadaRev15();
    pararRepriseRev15();

    try {
      if (!audioRadio.src || !audioRadio.src.includes(STREAM)) {
        audioRadio.src = STREAM;
        audioRadio.load();
      }
    } catch (e) {}

    modoRev15 = "radio";
    try { estadoAtual = "radio"; audioAtual = audioRadio; } catch (e) {}
    uiTocandoRev15("Rádio Black In Love", "Rádio ao vivo em reprodução.", "AO VIVO", "ao-vivo");
    fecharMenuRev15();

    const p = audioRadio.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () {
        try { if (typeof atualizarPlayerOpcional === "function") atualizarPlayerOpcional("Rádio", "Não foi possível tocar a rádio. Clique novamente.", "ERRO", "status-badge warning"); } catch (e) {}
      });
    }
  }

  function tocarChamadaRev15() {
    if (!audioChamada) return;

    pararRadioRev15();
    pararRepriseRev15();

    try {
      audioChamada.pause();
      audioChamada.setAttribute("src", CHAMADA_SRC_REV15);
      audioChamada.load();
      audioChamada.currentTime = 0;
      audioChamada.muted = false;
      if (audioRadio) audioChamada.volume = audioRadio.volume || 0.9;
    } catch (e) {}

    modoRev15 = "chamada";
    try { estadoAtual = "chamada"; audioAtual = audioChamada; } catch (e) {}
    uiTocandoRev15("Chamada de abertura", "Vinheta oficial em reprodução.", "CHAMADA", "vinheta");
    fecharMenuRev15();

    const p = audioChamada.play();
    if (p && typeof p.catch === "function") {
      p.catch(function (erro) {
        try { if (typeof atualizarPlayerOpcional === "function") atualizarPlayerOpcional("Chamada", "O navegador bloqueou a vinheta. Clique novamente no botão Chamada.", "ERRO", "status-badge warning"); } catch (e) {}
        console.warn("REV15 chamada play bloqueado:", erro);
      });
    }
  }

  function tocarRepriseRev15() {
    pararRadioRev15();
    pararChamadaRev15();

    repriseLigadaRev15 = true;
    modoRev15 = "reprise";
    try { estadoAtual = "reprise"; audioAtual = null; } catch (e) {}

    if (frameReprise) {
      try {
        frameReprise.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
        frameReprise.setAttribute("src", REPRISE_SRC_REV15 + "&cache=" + Date.now());
      } catch (e) {}
    }

    uiTocandoRev15("Reprise Experiência Black", "Reprise oficial do YouTube em reprodução.", "REPRISE", "reprise");
    fecharMenuRev15();
  }

  if (btnRadio) {
    btnRadio.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      if (modoRev15 === "radio" && audioRadio && !audioRadio.paused) return pararTudoRev15();
      tocarRadioRev15();
    }, true);
  }

  if (btnChamada) {
    btnChamada.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      if (modoRev15 === "chamada" && audioChamada && !audioChamada.paused) return pararTudoRev15();
      tocarChamadaRev15();
    }, true);
  }

  if (btnReprise) {
    btnReprise.addEventListener("click", function (ev) {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      if (modoRev15 === "reprise" && repriseLigadaRev15) return pararTudoRev15();
      tocarRepriseRev15();
    }, true);
  }

  if (audioChamada) {
    audioChamada.addEventListener("ended", function () {
      if (modoRev15 === "chamada") pararTudoRev15();
    });
  }
})();

/* =========================================================
   REV16 - REPRISE ABRE PLAYLIST/LIVE DO YOUTUBE EM NOVA ABA
   Escopo único: botão Reprise.
   Motivo: YouTube bloqueia play/pause em iframe oculto; o fluxo correto
   para playlist/live é direcionar o usuário ao YouTube.
   ========================================================= */
(function () {
  const LINK_REPRISE_YOUTUBE = (window.BLACK_CONFIG && window.BLACK_CONFIG.links && window.BLACK_CONFIG.links.reprise) || (typeof LINKS !== "undefined" && LINKS.reprise) || "https://www.youtube.com/watch?v=hylxoxVXkeM&list=PLH0Y4fXuozBG1BmItoDSBV-KEoTwxWqSC";

  function pegarRev16(id) {
    return document.getElementById(id);
  }

  const botaoAntigo = pegarRev16("choicePauseBtn");
  if (!botaoAntigo || !botaoAntigo.parentNode) return;

  const botaoNovo = botaoAntigo.cloneNode(true);
  botaoAntigo.parentNode.replaceChild(botaoNovo, botaoAntigo);

  botaoNovo.textContent = "Reprise";
  botaoNovo.setAttribute("aria-label", "Abrir reprise no YouTube");
  botaoNovo.setAttribute("title", "Abrir reprise no YouTube");

  botaoNovo.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      if (typeof fecharMenuFlyer === "function") fecharMenuFlyer();
      const menu = pegarRev16("flyerChoiceMenu");
      if (menu) menu.classList.remove("open");
    } catch (e) {}

    window.open(LINK_REPRISE_YOUTUBE, "_blank", "noopener,noreferrer");
  }, true);
})();


/* =========================================================
   REV17 - CORREÇÃO DEFINITIVA DO BOTÃO CHAMADA
   Escopo único: botão Chamada.
   Motivo: isolar a vinheta do fluxo antigo para não depender dos
   eventos acumulados das revisões anteriores.
   - Clique 1: toca assets/audio/chamada.mp3
   - Clique 2: pausa a chamada
   - Não altera rádio nem reprise.
   ========================================================= */
(function () {
  const CHAMADA_MP3_REV17 = "assets/audio/chamada.mp3";

  function elRev17(id) { return document.getElementById(id); }

  const botaoAntigo = elRev17("choiceIntroBtn");
  if (!botaoAntigo || !botaoAntigo.parentNode) return;

  const botaoNovo = botaoAntigo.cloneNode(true);
  botaoNovo.textContent = "Chamada";
  botaoNovo.setAttribute("aria-label", "Tocar ou pausar chamada");
  botaoNovo.setAttribute("title", "Tocar ou pausar chamada");
  botaoAntigo.parentNode.replaceChild(botaoNovo, botaoAntigo);

  const radio = elRev17("streamAudio");
  const audioHtml = elRev17("introAudio");
  const chamada = new Audio(CHAMADA_MP3_REV17);
  chamada.preload = "auto";
  chamada.volume = 0.9;

  function fecharMenuRev17() {
    try { if (typeof fecharMenuFlyer === "function") fecharMenuFlyer(); } catch (e) {}
    const menu = elRev17("flyerChoiceMenu");
    if (menu) menu.classList.remove("open");
  }

  function atualizarVolumeRev17() {
    try {
      const flyerVolume = elRev17("flyerVolumeControl");
      const volumeGeral = elRev17("volumeControl");
      const valor = flyerVolume ? Number(flyerVolume.value) : (volumeGeral ? Number(volumeGeral.value) : 0.9);
      if (!Number.isNaN(valor)) chamada.volume = valor;
    } catch (e) {}
  }

  function uiChamadaTocandoRev17() {
    try { estadoAtual = "chamada"; } catch (e) {}
    try { audioAtual = chamada; } catch (e) {}
    try { if (typeof setPlayerPlaying === "function") setPlayerPlaying(true); } catch (e) {}
    try { if (typeof atualizarIconePlay === "function") atualizarIconePlay(true); } catch (e) {}
    try { if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("vinheta"); } catch (e) {}
    try { if (typeof setConnection === "function") setConnection("CHAMADA", "connected"); } catch (e) {}
    try {
      if (typeof atualizarPlayerOpcional === "function") {
        atualizarPlayerOpcional("Chamada de abertura", "Vinheta oficial em reprodução.", "CHAMADA", "status-badge live");
      }
    } catch (e) {}
  }

  function uiChamadaPausadaRev17() {
    try { estadoAtual = "pausado"; } catch (e) {}
    try { audioAtual = null; } catch (e) {}
    try { if (typeof setPlayerPlaying === "function") setPlayerPlaying(false); } catch (e) {}
    try { if (typeof atualizarIconePlay === "function") atualizarIconePlay(false); } catch (e) {}
    try { if (typeof atualizarSeloAoVivo === "function") atualizarSeloAoVivo("pausado"); } catch (e) {}
    try { if (typeof setConnection === "function") setConnection("PAUSADO", "offline"); } catch (e) {}
    try {
      if (typeof atualizarPlayerOpcional === "function") {
        atualizarPlayerOpcional("Chamada de abertura", "Chamada pausada.", "PAUSADO", "status-badge");
      }
    } catch (e) {}
  }

  function pararChamadaRev17() {
    chamada.pause();
    uiChamadaPausadaRev17();
  }

  function tocarChamadaRev17() {
    fecharMenuRev17();

    try { if (radio) radio.pause(); } catch (e) {}
    try { if (audioHtml) audioHtml.pause(); } catch (e) {}
    try { if (typeof pausarReprise === "function") pausarReprise(); } catch (e) {}

    atualizarVolumeRev17();

    try { chamada.currentTime = 0; } catch (e) {}
    chamada.muted = false;
    uiChamadaTocandoRev17();

    const playPromise = chamada.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (erro) {
        uiChamadaPausadaRev17();
        try {
          if (typeof atualizarPlayerOpcional === "function") {
            atualizarPlayerOpcional("Chamada de abertura", "O navegador bloqueou a vinheta. Clique novamente em Chamada.", "ERRO CHAMADA", "status-badge warning");
          }
        } catch (e) {}
        console.warn("REV17 chamada bloqueada:", erro);
      });
    }
  }

  botaoNovo.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (!chamada.paused) {
      pararChamadaRev17();
      return;
    }

    tocarChamadaRev17();
  }, true);

  chamada.addEventListener("ended", function () {
    try { chamada.currentTime = 0; } catch (e) {}
    uiChamadaPausadaRev17();
  });

  chamada.addEventListener("error", function () {
    uiChamadaPausadaRev17();
    try {
      if (typeof atualizarPlayerOpcional === "function") {
        atualizarPlayerOpcional("Chamada de abertura", "Erro ao carregar assets/audio/chamada.mp3.", "ERRO CHAMADA", "status-badge warning");
      }
    } catch (e) {}
  });
})();

/* =========================================================
   MASTER v1.0.5 - Estado visual ativo dos botões do vinil
   Escopo: somente classe visual is-active.
   ========================================================= */
(function () {
  function botao(id) { return document.getElementById(id); }
  function limparAtivos() {
    ["choiceRadioBtn", "choiceIntroBtn", "choicePauseBtn"].forEach(function (id) {
      const b = botao(id);
      if (b) b.classList.remove("is-active");
    });
  }
  function marcar(id) {
    limparAtivos();
    const b = botao(id);
    if (b) b.classList.add("is-active");
  }
  const radio = botao("choiceRadioBtn");
  const chamada = botao("choiceIntroBtn");
  const reprise = botao("choicePauseBtn");
  if (radio) radio.addEventListener("click", function () { marcar("choiceRadioBtn"); }, true);
  if (chamada) chamada.addEventListener("click", function () { marcar("choiceIntroBtn"); }, true);
  if (reprise) reprise.addEventListener("click", function () { marcar("choicePauseBtn"); }, true);
  ["streamAudio", "introAudio"].forEach(function (id) {
    const a = document.getElementById(id);
    if (!a) return;
    a.addEventListener("pause", function () {
      setTimeout(function () {
        try {
          if (typeof estadoAtual !== "undefined" && (estadoAtual === "pausado" || estadoAtual === "")) limparAtivos();
        } catch (e) {}
      }, 80);
    });
    a.addEventListener("ended", limparAtivos);
  });
})();
