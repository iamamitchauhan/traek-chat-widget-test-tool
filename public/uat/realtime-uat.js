let traekChatCss = `
:root {
  --widgetColor: "#fff";
  }

.traekChatboxIframeCss body {
  margin:auto;
}

.traekChatNotificationCss {
  position: fixed;
  height: 16px;
  width: 16px;
  background-color: red;
  border-radius: 25px;
  transition: all 0.2s, display 0s;
  z-index:9999999999;
  border:0;
}

.traekChatboxIframeCss{
  display: block;
  position: fixed;
  width: 400px;
  height: 600px;
  border-radius: 12px;
  box-shadow: 0px 0px 24.9655px rgba(114, 120, 145, 0.25);
  background: #fff;
  transition: all 0.2s, display 0s;
  z-index: 1000000000;
  border:0;
  animation: jump-chat-box-open-general 0.6s linear alternate;
}

.traek-hide-element{
  display:none;
}

.traekChatIconIframeCss {
  margin:auto;
  position:fixed;
  height: 60px;
  width: 60px;
  border-radius: 50%;
  z-index: 999999999;
  border: none;
  animation: jump-chat-widget 0.9s linear alternate;
  animation-fill-mode: forwards;
}

.chat-icon-top-left{
  top:25px;
  left:10px;
}
.chat-box-top-left{
  top: 10px;
  left:10px;
}
.chat-icon-top-right{
  top: 25px;
  right: 10px;
}
.chat-box-top-right{
  top: 10px;
  right: 10px;
}
.chat-icon-middle-left{
  top: 50%;
  left:10px;
  transform: translateY(-50%);
}
.chat-box-middle-left{
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  animation: jump-chat-box-open-middle 0.4s linear alternate;
  margin-left: 12px;
}
.chat-icon-middle-right{
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}
.chat-box-middle-right{
  top: 50%;
  right: 5px;
  transform: translateY(-50%);
  animation: jump-chat-box-open-middle 0.4s linear alternate;
  margin-right: 12px;
}
.chat-icon-bottom-left{
  bottom:25px;
  left:10px;
}
.chat-box-bottom-left{
  bottom:10px;
  left:10px;
}
.chat-icon-bottom-right{
  bottom: 25px;
  right: 10px;
}
.chat-box-bottom-right{
  bottom: 10px;
  right: 10px;
}
.chat-notification-top-left{
  top: 60px;
  left: 50px;
}
.chat-notification-top-right{
  top: 60px;
  right: 50px;
}
.chat-notification-middle-left{
  top: 50%;
  left: 50px;
}
.chat-notification-middle-right{
  top: 50%;
  right: 50px;
}
.chat-notification-bottom-left{
  bottom: 60px;
  left: 50px;
}
.chat-notification-bottom-right{
  bottom: 60px;
  right: 50px;
}

 @media only screen and (max-width: 600px) {
  .traekChatboxIframeCss{
    right: 0;
    width: 100%;
    left: 0;
    max-width: 100%;
    bottom: 0;
    top: 0;
    height: 100%;
    border-radius:0;
  }
  .chat-box-middle-left{
    transform: translateY(0%);
  }
  .chat-box-middle-right{
    transform: translateY(0%);
  }
  .traekChatboxIframeCss::after {
    content: '';
    position: absolute;
    z-index: -1;
    top: -30px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
  }
}
@media screen and (min-width: 320px) and (max-width: 600px) and (orientation: landscape) {
  .chat-box-bottom-right {
    top: 30px;
    right:0;
    bottom:0;
    left:0;
  }
  .traekChatboxIframeCss {
    width:100%;
    height:calc(100% - 160px);
  }
   #chat-emoji{
    display: none;
  }
  .chat-box::after{
    content: '';
    position: absolute;
    z-index: -1;
    top: -30px;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
  }
}
@keyframes jump-chat-widget {
  0%   {transform: translate3d(0,30%,0); opacity: 0;}
  25%  {transform: translate3d(0,-40%,0)}
  50%  {transform: translate3d(0,0%,0)}
  75%  {transform: translate3d(0,-20%,0)}
  100% {transform: translate3d(0,0%,0); opacity: 1;}
}

@keyframes jump-chat-box-open-general {
  0%   {transform: translateY(8%); opacity: 0;}
  50%  {transform: translateY(-8%); opacity: 0.5;}
  100% {transform: translateY(0%); opacity: 1;}
}

@keyframes jump-chat-box-open-middle {
  0%   {transform: translateY(0%); opacity: 0;}
  50% {transform: translateY(-58%); opacity: 1;}
  100% {transform: translateY(-50%); opacity: 1;}
}
`;
(function (App) {
  App.realtimeCommunicationLayer = function (TraekObject) {
    this.hostUrl = TraekObject.hostUrl;
    this.cdnUrl = TraekObject.cdnUrl;
    this.traekChatIcon;
    this.traekChatBox;
    this.traekNotification;
    this.chatWidget = TraekObject.chatWidget;
  };

  App.realtimeCommunicationLayer.prototype.showChatIcon = function () {
    this.traekChatIcon.classList.remove("traek-hide-element");
  };

  // Toggle-Chatbox
  App.realtimeCommunicationLayer.prototype.showHide = function () {
    this.traekChatBox && (this.traekChatBox.classList.contains("traek-hide-element") ? this.openChatBox() : this.closeChatbox());
  };

  App.realtimeCommunicationLayer.prototype.closeChatbox = function () {
    this.traekChatIcon.classList.add("jump-chat-widget");
    this.traekChatBox?.classList.add("traek-hide-element");
    this.chatBoxClosedHandler();
  };
  App.realtimeCommunicationLayer.prototype.openChatBox = function () {
    this.traekChatBox?.classList.remove("traek-hide-element");
    this.chatBoxOpenedHandler();
  };

  App.realtimeCommunicationLayer.prototype.chatBoxClosedHandler = function () {
    this.traekChatBox?.contentWindow?.postMessage({ target: "traekAnalytics", action: "chatBoxClosed" }, "*");
  };
  App.realtimeCommunicationLayer.prototype.chatBoxOpenedHandler = function () {
    this.traekChatBox?.contentWindow?.postMessage({ target: "traekAnalytics", action: "chatBoxOpened" }, "*");
    this.hideNotification();
  };
  App.realtimeCommunicationLayer.prototype.pageChangeHandler = function (newURL, newPageTitle) {
    this.traekChatBox?.contentWindow?.postMessage({ target: "traekAnalytics", action: "pageChanged", newURL, newPageTitle }, "*");
    this.hideNotification();
  };

  App.realtimeCommunicationLayer.prototype.showNotification = function () {
    this.traekChatNotification?.classList.remove("traek-hide-element");
  };
  App.realtimeCommunicationLayer.prototype.hideNotification = function () {
    this.traekChatNotification?.classList.add("traek-hide-element");
  };

  App.realtimeCommunicationLayer.prototype.handleEvents = function () {
    document.documentElement.style.setProperty("--widgetColor", this.chatWidget?.colors?.headerBackground || "#fff");

    let iframeCss = document.createElement("style");
    iframeCss.innerHTML = traekChatCss;
    document.head.appendChild(iframeCss);

    let traekChatIconIframe = document.createElement("iframe");
    traekChatIconIframe.src = this.cdnUrl + "/traek-chat-icon-uat.html";
    traekChatIconIframe.id = "traek-chat-icon-iframe";
    traekChatIconIframe.title = "Traek Chat Icon";
    traekChatIconIframe.classList.add("traekChatIconIframeCss", "traek-hide-element");

    let traekChatBoxIframe = document.createElement("iframe");
    traekChatBoxIframe.src = this.cdnUrl + "/traek-chat-box-uat.html";
    traekChatBoxIframe.id = "traek-chat-box-iframe";
    traekChatBoxIframe.classList.add("traekChatboxIframeCss", "traek-hide-element");

    let traekChatNotificationDiv = document.createElement("iframe");
    traekChatNotificationDiv.id = "traek-chat-notification-iframe";
    traekChatNotificationDiv.classList.add("traekChatNotificationCss", "traek-hide-element");

    switch (this.chatWidget?.widgetIconAlignment) {
      case "widget-top-left":
        traekChatIconIframe.classList.add("chat-icon-top-left");
        traekChatBoxIframe.classList.add("chat-box-top-left");
        traekChatNotificationDiv.classList.add("chat-notification-top-left");
        break;
      case "widget-top-right":
        traekChatIconIframe.classList.add("chat-icon-top-right");
        traekChatBoxIframe.classList.add("chat-box-top-right");
        traekChatNotificationDiv.classList.add("chat-notification-top-right");
        break;
      case "widget-bottom-right":
        traekChatIconIframe.classList.add("chat-icon-bottom-right");
        traekChatBoxIframe.classList.add("chat-box-bottom-right");
        traekChatNotificationDiv.classList.add("chat-notification-bottom-right");
        break;
      case "widget-bottom-left":
        traekChatIconIframe.classList.add("chat-icon-bottom-left");
        traekChatBoxIframe.classList.add("chat-box-bottom-left");
        traekChatNotificationDiv.classList.add("chat-notification-bottom-left");
        break;
      case "widget-middle-left":
        traekChatIconIframe.classList.add("chat-icon-middle-left");
        traekChatBoxIframe.classList.add("chat-box-middle-left");
        traekChatNotificationDiv.classList.add("chat-notification-middle-left");
        break;
      case "widget-middle-right":
        traekChatIconIframe.classList.add("chat-icon-middle-right");
        traekChatBoxIframe.classList.add("chat-box-middle-right");
        traekChatNotificationDiv.classList.add("chat-notification-middle-right");
        break;
      default:
        traekChatIconIframe.classList.add("chat-icon-bottom-right");
        traekChatBoxIframe.classList.add("chat-box-bottom-right");
        traekChatNotificationDiv.classList.add("chat-notification-bottom-right");
        break;
    }
    document.body.appendChild(traekChatBoxIframe);
    document.body.appendChild(traekChatIconIframe);
    document.body.appendChild(traekChatNotificationDiv);
    this.traekChatIcon = traekChatIconIframe;
    this.traekChatBox = traekChatBoxIframe;
    this.traekChatNotification = traekChatNotificationDiv;
    window.addEventListener(
      "message",
      ({ data }) => {
        if (data.target === "traekAnalytics") {
          switch (data.action) {
            case "chatIconLoaded":
              this.traekChatIcon?.contentWindow?.postMessage(
                {
                  target: "traekAnalytics",
                  action: "companyLogo",
                  logo: this.chatWidget?.company_logo,
                  position: this.chatWidget?.widgetIconAlignment,
                },
                "*"
              );
              const observer = new MutationObserver(() => {
                this.pageChangeHandler(document.URL, document.title);
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true,
              });
              break;
            case "getObject":
              this.traekChatBox?.contentWindow?.postMessage(
                {
                  target: "traekAnalytics",
                  action: "traekObject",
                  traekObject: JSON.stringify(App.TraekAnalytics.currentObject),
                },
                "*"
              );
              break;
            case "toggleChatBoxView":
              this.showHide();
              break;
            case "closeChatBox":
              this.closeChatbox();
              break;
            case "openChatBox":
              this.openChatBox();
              break;
            case "chatLoaded":
              this.showChatIcon();
              break;
            case "showNotification":
              this.showNotification();
              break;
            default:
              break;
          }
        }
      },
      false
    );
  };
})(Traek);
let traekRealtime = new Traek.realtimeCommunicationLayer(Traek.TraekAnalytics.currentObject).handleEvents();
