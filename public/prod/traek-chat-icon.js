parent.postMessage({ target: "traekAnalytics", action: "chatIconLoaded" }, "*");
const toggleChatBox = () => {
  window.parent.postMessage({ target: "traekAnalytics", action: "toggleChatBoxView" }, "*");
};
const showNotification = () => {
  document.querySelector("#traek-chat-notification").classList.remove("hide");
};

const hideNotificaiton = () => {
  document.querySelector("#traek-chat-notification").classList.add("hide");
};

window.addEventListener(
  "message",
  ({ data }) => {
    if (data?.target === "traekAnalytics" && data?.action === "companyLogo") {
      const container = document.querySelector(".chat-icon");
      if (container) {
        container.classList.add(`${data?.position}`);
        container.innerHTML = `<img class="chat-logo" src="${data?.logo || "https://assets.traek.io/chat-icon-dark.png"}" alt="logo" />`;
      }
    }
  },
  false
);
