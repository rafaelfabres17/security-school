const statusDocument = document.getElementById("status");
const passwordDocument = document.getElementById("password");
const buttonDocument = document.getElementById("toggle");
const messageDocument = document.getElementById("message");

function renderize(active) {
  statusDocument.textContent = `Bloqueio de IA: ${active ? "Ativado" : "Desativado"}`;
  statusDocument.dataset.active = String(active);
  buttonDocument.textContent = active
    ? "Desativar bloqueio"
    : "Ativar bloqueio";
}

function show(text, error = false) {
  messageDocument.textContent = text;
  messageDocument.dataset.error = String(error);
}

async function toggle() {
  const password = passwordDocument.value;
  if (!password) return show("Informa a senha.", true);

  buttonDocument.disabled = true;
  try {
    const r = await chrome.runtime.sendMessage({ type: "toggle", password });
    if (r?.ok) {
      renderize(r.active);
      show(r.active ? "Bloqueio de IA ativado." : "Bloqueio de IA desativado.");
    } else if (r?.reason === "wait") {
      show(`Muitas tentativas. Aguarde ${r.seconds}s.`, true);
    } else if (r?.reason === "password") {
      show("Senha incorreta. Nada foi alterado.", true);
    } else {
      show("Erro ao alterar o status.", true);
    }
  } catch {
    show("Erro ao falar com a extensão. Recarregue-a.", true);
  } finally {
    buttonDocument.disabled = false;
  }
}

async function init() {
  const { active } = await chrome.runtime.sendMessage({ type: "status" });
  renderize(active);
  buttonDocument.addEventListener("click", toggle);
  passwordDocument.addEventListener("keydown", (e) => {
    if (e.key === "Enter") toggle();
  });
}

init();
