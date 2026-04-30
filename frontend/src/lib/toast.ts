type ToastType = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const DURATION = 4000;

function show(type: ToastType, message: string) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const el = document.createElement("div");
  el.className = `toast-item toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${ICONS[type]}</span>
    <div class="toast-body">
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close">✕</button>
    <div class="toast-progress" style="animation-duration:${DURATION}ms;"></div>
  `;

  container.appendChild(el);

  const close = () => {
    el.classList.add("removing");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  };

  el.querySelector(".toast-close")!.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });
  el.addEventListener("click", close);
  setTimeout(close, DURATION);
}

export const toast = {
  success: (msg: string) => show("success", msg),
  error:   (msg: string) => show("error",   msg),
  info:    (msg: string) => show("info",     msg),
  warning: (msg: string) => show("warning", msg),
};