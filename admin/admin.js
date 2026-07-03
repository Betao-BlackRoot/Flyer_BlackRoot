const ADMIN_PASSWORD = "BlackInLove@2026";
const $ = (id) => document.getElementById(id);
const base = window.BLACK_CONFIG || {};
const links = base.links || {};
const estreia = base.estreia || {};
const fields = ["streamUrl","radioStatus","reprise","youtube","instagram","facebook","whatsapp","site","appRadios","appAndroid","appApple","radioOffline","ano","mes","dia","hora","minuto"];
function value(id){return $(id).value.trim();}
function set(id,v){$(id).value = v || "";}
function build(){
  const cfg = {
    radioStatus: value("radioStatus") || "online",
    streamUrl: value("streamUrl"),
    estreia: {
      ano: Number(value("ano")), mes: Number(value("mes")), dia: Number(value("dia")), hora: Number(value("hora")), minuto: Number(value("minuto"))
    },
    links: {
      facebook: value("facebook"), instagram: value("instagram"), whatsapp: value("whatsapp"), youtube: value("youtube"), site: value("site"),
      appRadios: value("appRadios"), appAndroid: value("appAndroid"), appApple: value("appApple"), radioOffline: value("radioOffline"), reprise: value("reprise")
    }
  };
  return "/* Configurações editáveis - gerado pelo Black Admin */\nwindow.BLACK_CONFIG = " + JSON.stringify(cfg,null,2) + ";\n";
}
function refresh(){ $("output").value = build(); }
function load(){
  set("streamUrl", base.streamUrl); set("radioStatus", base.radioStatus || "online");
  set("reprise", links.reprise); set("youtube", links.youtube); set("instagram", links.instagram); set("facebook", links.facebook); set("whatsapp", links.whatsapp); set("site", links.site); set("appRadios", links.appRadios); set("appAndroid", links.appAndroid); set("appApple", links.appApple); set("radioOffline", links.radioOffline);
  set("ano", estreia.ano); set("mes", estreia.mes); set("dia", estreia.dia); set("hora", estreia.hora); set("minuto", estreia.minuto); refresh();
}
$("loginBtn").addEventListener("click", () => {
  if ($("passwordInput").value !== ADMIN_PASSWORD) { alert("Senha incorreta."); return; }
  $("loginBox").classList.add("hidden"); $("panelBox").classList.remove("hidden"); load();
});
fields.forEach(id => { const el=$(id); if(el) el.addEventListener("input", refresh); });
$("copyBtn").addEventListener("click", async () => { await navigator.clipboard.writeText(build()); alert("Conteúdo copiado."); });
$("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([build()], {type:"text/javascript;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "config.js"; a.click(); URL.revokeObjectURL(a.href);
});
$("passwordInput").addEventListener("keydown", e => { if(e.key === "Enter") $("loginBtn").click(); });
