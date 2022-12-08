parent.postMessage({ target: "traekAnalytics", action: "getObject" }, "*");
window.addEventListener(
  "message",
  ({ data }) => {
    if (data?.target === "traekAnalytics" && data?.action === "traekObject") {
      window.Traek = {};
      (function (App) {
        App.RealtimeAnalytics = function () {
          const traek = JSON.parse(data.traekObject);
          this.unsubscribeChat = () => { };
          this.unsubscribeUser = () => { };
          this.hostUrl = traek.hostUrl;
          this.cdnUrl = traek.cdnUrl;
          this.propertyId = traek.propertyId;
          this.ipAddress = traek.ip;
          this.userKey = traek.userKey;
          this.userTypingTimeout;
          this.currentPageUrl = traek.pageUrl;
          this.currentPageTitle = traek.pageTitle;
          this.referrer = traek.referrer;
          this.userAgent = traek.userAgent;
          this.sessionKey = traek.sessionKey;
          this.chatWidget = traek.chatWidget || {};
          this.firebase;
          this.userTypingStatusInterval;
          this.initiated = false;
          this.traekImages = [];
          this.manualCloseHandler = false;
          this.tempFlag = true;
          this.clientReadCheck;
          this.intervalId = null;
          this.chats = [];
          this.isTabOpen = true;
          this.pingTimeInterval = 10 * 1000;
          this.isChatBoxOpen = false;
          this.tmpImages = [];
          this.uploadingImage = false;
          this.autoOpenChatBox = true;
          this.supportExecutiveImage = "https://assets.traek.io/executive-placeholder-image.png";
          this.companyLogo = "https://assets.traek.io/chat-icon-dark.png";
          this.headerContent = "Please fill out the form below for Sid to start helping you.";
          this.supportMessageContent = "I am here to help.";
          this.headerBackgroundColor = "#6a7bff";
          this.headerTextColor = "#FFFFFF";
          this.agentMessageBackground = "#FFFFFF";
          this.agentText = "#4b5563";
          this.visitorMessageBackground = "#6A7BFF";
          this.visitorText = "#FFFFFF";
          this.navigationUpdated = false;
          this.firebaseConfig = {
            apiKey: "AIzaSyAHsmw0biHHRWvaOUBFUOd8B1Y9q54kDA0",
            authDomain: "traek-staging.firebaseapp.com",
            projectId: "traek-staging",
            storageBucket: "traek-staging.appspot.com",
            messagingSenderId: "942400633658",
            appId: "1:942400633658:web:23db8476133350dd272e03",
          };
        };

        App.RealtimeAnalytics.prototype.localization = function () {
          const defaultLocale = "en";
          let locale = this.chatWidget?.widget_language || "en";
          let translations = {};

          async function setLocale(newLocale) {
            if (newLocale === defaultLocale) return;
            const newTranslations = await fetchTranslationsFor(newLocale);
            translations = newTranslations;
            translatePage();
          }

          async function fetchTranslationsFor(newLocale) {
            const response = await fetch(`https://assets.traek.io/lang/${newLocale}.json`);
            return await response.json();
          }

          function translatePage() {
            document.querySelectorAll("[data-i18n-key-innertext]").forEach(translateInnerText);

            document.querySelectorAll("[data-i18n-key-placeholder]").forEach(translatePlaceholder);
          }

          function translateInnerText(element) {
            const key = element.getAttribute("data-i18n-key-innertext");
            const translation = translations[key];
            element.innerText = translation;
          }

          function translatePlaceholder(element) {
            const key = element.getAttribute("data-i18n-key-placeholder");
            const translation = translations[key];
            element.placeholder = translation;
          }

          setLocale(locale);
        };

        App.RealtimeAnalytics.prototype.addStyling = function () {
          document.documentElement.style.setProperty("--widgetColor", this.chatWidget?.colors?.headerBackground || this.headerBackgroundColor);
          document.documentElement.style.setProperty("--headerTextColor", this.chatWidget?.colors?.headerText || this.headerTextColor);
          document.documentElement.style.setProperty(
            "--agentMessageBackground",
            this.chatWidget?.colors?.agentMessageBackground || this.agentMessageBackground
          );
          document.documentElement.style.setProperty("--agentText", this.chatWidget?.colors?.agentText || this.agentText);
          document.documentElement.style.setProperty(
            "--visitorMessageBackground",
            this.chatWidget?.colors?.visitorMessageBackground || this.visitorMessageBackground
          );
          document.documentElement.style.setProperty("--visitorText", this.chatWidget?.colors?.visitorText || this.visitorText);
        };

        App.RealtimeAnalytics.prototype.startPing = function () {
          this.intervalId = setInterval(() => {
            let payload = JSON.stringify({
              status: "active",
              ipAddress: this.ipAddress,
              currentPageUrl: this.currentPageUrl,
              currentPageTitle: this.currentPageTitle,
              referrer: this.referrer,
              propertyId: this.propertyId,
              userKey: this.userKey,
              userAgent: this.userAgent,
              sessionKey: this.sessionKey,
              activityTimestamp: new Date(),
            });
            navigator.sendBeacon(this.hostUrl + "/api/realtime/update", payload);
          }, this.pingTimeInterval);
        };

        App.RealtimeAnalytics.prototype.clearPing = function () {
          clearInterval(this.intervalId);
        };

        App.RealtimeAnalytics.prototype.init = function () {
          this.initiateFirebase();
          this.addStyling();
          this.addEmojiPicker();
          this.setUserStatus({ status: "active" });

          const eventState = {
            isFormSubmitted: false
          }

          localStorage.setItem("eventState", JSON.stringify(eventState))
          window.addEventListener("message", ({ data }) => {
            if (data?.target === "traekAnalytics") {
              switch (data.action) {
                case "chatBoxClosed":
                  this.chatBoxClosed();
                  break;
                case "chatBoxOpened":
                  this.chatBoxOpened();
                  break;
                default:
                  break;
              }
            }
          });

          this.startPing();

          window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              // start interval and update activityTimeStamp with current timestamp
              // update status = active
              // clear previous ping and start newone
              this.setUserStatus({ status: "active" });
              this.clearPing();
              this.startPing();
              this.visitedTime = new Date();
            } else {
              // if user is in another tab
              // set status  = idle
              // clear interval
              this.setUserStatus({ status: "idle" });
              this.clearPing();
            }
          });

          window.addEventListener("beforeunload", (e) => {
            // clear pings and make offline status
            this.clearPing();
            this.setUserStatus({ status: "offline" });
            this.isTabOpen = false;
          });
        };

        App.RealtimeAnalytics.prototype.initiateFirebase = function () {
          let googleFirebaseAppCDN = document.createElement("script");
          let googleFirebaseAuthCDN = document.createElement("script");
          let googleFirebaseStorageCDN = document.createElement("script");
          let googleFirebaseFirestoreCDN = document.createElement("script");
          googleFirebaseAppCDN.src = "https://www.gstatic.com/firebasejs/8.7.1/firebase-app.js";
          document.head.appendChild(googleFirebaseAppCDN);
          googleFirebaseAppCDN.onload = () => {
            googleFirebaseAuthCDN.src = "https://www.gstatic.com/firebasejs/8.7.1/firebase-auth.js";
            document.head.appendChild(googleFirebaseAuthCDN);
            googleFirebaseAuthCDN.onload = () => {
              googleFirebaseStorageCDN.src = "https://www.gstatic.com/firebasejs/8.7.1/firebase-storage.js";
              document.head.appendChild(googleFirebaseStorageCDN);
              googleFirebaseStorageCDN.onload = () => {
                googleFirebaseFirestoreCDN.src = "https://www.gstatic.com/firebasejs/8.7.1/firebase-firestore.js";
                document.head.appendChild(googleFirebaseFirestoreCDN);
                googleFirebaseFirestoreCDN.onload = () => {
                  this.startRealtimeTraeking();
                };
              };
            };
          };
        };

        App.RealtimeAnalytics.prototype.throttle = function (func, limit) {
          if (!this.userTypingTimeout) {
            this[func]();
            this.userTypingTimeout = setTimeout(() => {
              this.userTypingTimeout = undefined;
            }, limit);
          }
        };

        App.RealtimeAnalytics.prototype.updateUserTyping = function () {
          if (this.initiated) {
            this.firebase
              .firestore()
              .collection("conversations")
              .doc(this.propertyId + this.userKey)
              .set({ typing: { client: { typing: true, timeStamp: new Date() } } }, { merge: true });
          }
        };

        App.RealtimeAnalytics.prototype.addEmojiPicker = function () {
          let traekEmojiPicker = document.createElement("script");
          traekEmojiPicker.src = this.cdnUrl + "/traek-emoji-picker.js";
          traekEmojiPicker.onload = () => {
            new FgEmojiPicker({
              trigger: ["#chat-emoji"],
              position: ["top", "left"],
              preFetch: false,
              emit(obj) {
                const emoji = obj.emoji;
                document.querySelector("#chat-input").value += emoji;
              },
            });
          };
          document.head.appendChild(traekEmojiPicker);
        };

        App.RealtimeAnalytics.prototype.formatChatTime = function (time) {
          const chatDateTime = new Date(time.seconds * 1000);
          let options = {
            hour: "numeric",
            minute: "numeric",
          };
          const currentDateTime = new Date();

          const diffInDateTime = currentDateTime.getTime() - chatDateTime.getTime();
          const chatHour = Math.floor(diffInDateTime / (1000 * 3600));
          const chatMin = Math.floor(diffInDateTime / (1000 * 60));

          if (chatHour <= 1 && chatMin < 1) {
            return "Few seconds ago";
          }
          if (chatMin >= 1 && chatMin <= 2) {
            return "a minute ago";
          }
          if (chatMin >= 1 && chatMin <= 5) {
            return "Few minutes ago";
          }
          if (chatMin > 5 && chatMin < 60) {
            return `${chatMin} minutes ago`;
          }
          if (chatHour >= 1) {
            return new Intl.DateTimeFormat("en-US", options).format(chatDateTime);
          }
        };

        App.RealtimeAnalytics.prototype.startRealtimeTraeking = async function () {
          this.firebase = firebase.initializeApp(this.firebaseConfig);
          await this.firebase
            .auth()
            .signInAnonymously()
            .then(() => {
              parent.postMessage({ target: "traekAnalytics", action: "chatLoaded" }, "*");
              this.unsubscribeUser();
              this.unsubscribeUser = this.firebase
                .firestore()
                .collection("conversations")
                .doc(this.propertyId + this.userKey)
                .onSnapshot((doc) => {
                  if (doc.exists) {
                    let data = doc.data();
                    let { typing = {} } = data;
                    let typingIndicator = document.querySelector("#typing");
                    if (typingIndicator) {
                      if (typing?.server?.typing === true) {
                        typingIndicator.classList.remove("hide");
                        const setUserTyping = () => {
                          let ts = typing?.server?.timeStamp || {};
                          let currentTs = new Date().getTime();
                          let lastTypedTs = (ts.seconds || 0) * 1000;
                          let difference = currentTs - lastTypedTs;
                          if (difference > 4000) {
                            typingIndicator.classList.add("hide");
                            clearInterval(this.userTypingStatusInterval);
                          }
                        };
                        clearInterval(this.userTypingStatusInterval);
                        this.userTypingStatusInterval = setInterval(() => setUserTyping(), 1000);
                      } else {
                        clearInterval(this.userTypingStatusInterval);
                        typingIndicator.classList.add("hide");
                      }
                    }
                    if (this.initiated === data.initiated) {
                      return;
                    }
                    this.initiated = data.initiated;
                  } else {
                    this.initiated = false;
                  }
                  if (this.initiated) {
                    document.querySelector("#traek-chat-header").innerHTML = `
                  <div class="chat-header-initialized">
                    <div class="chat-header-inner">
                    
                  <div class="chat-box-header-logo">
                    <img class="chat-logo" src=${this.chatWidget?.company_logo || this.companyLogo} alt="logo" />

                    <img class="chat-user-logo" src=${this.chatWidget?.support_executive_image || this.supportExecutiveImage} alt="executive-image" />
                    <span class="chatbox-head-active-dot"></span>
                </div>
                  <div class="chat-header-text">
                    <div class="chat-online chat-offline"></div>
                    <div class="line-truncate-2">${this.chatWidget?.support_message || this.supportMessageContent}</div>
                  </div>
                <span class="chat-box-toggle" name="closeChatBoxHandlerToggle">
                  <svg
                    style="height: 15px"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke=${this.chatWidget?.colors?.headerText || this.headerTextColor}
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
                </div>
                </div>`;
                    document.querySelector("#traek-main-content").innerHTML = `<div class="chat-box-body">
                  <div class="chat-box-overlay"></div>
                  <div id="chatLogs" class="chat-logs">
                  </div>
                  <div
                    id="imagePreview"
                    style="
                      display: none;
                      position: relative;
                      height: 150px;
                      margin-top: 20px;
                    "
                  ></div>
                  <div id="typing" class="typing hide">Typing...</div>
                  </div>
                <div class="chat-input-wrap chat-msg-input-box">
                  <form name="updateChatFunction">
                    <input
                      data-i18n-key-placeholder="msg-input-placeholder"
                      type="text"
                      id="chat-input"
                      autocomplete="off"
                      placeholder="Write a message..."
                    />
                    <div id="chat-emoji" class="chat-tooltip">
                      <svg style="height: 18px; margin-bottom:-2px;" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.53415 18.0258C13.8429 18.0258 17.3359 14.5329 17.3359 10.2241C17.3359 5.91531 13.8429 2.42236 9.53415 2.42236C5.22537 2.42236 1.73242 5.91531 1.73242 10.2241C1.73242 14.5329 5.22537 18.0258 9.53415 18.0258Z" stroke="#BFBFC0" stroke-width="1.24828" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M6.41406 11.7844C6.41406 11.7844 7.58432 13.3448 9.53475 13.3448C11.4852 13.3448 12.6554 11.7844 12.6554 11.7844" stroke="#BFBFC0" stroke-width="1.24828" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M7.19336 7.88379H7.20064" stroke="#BFBFC0" stroke-width="1.56034" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M11.875 7.88379H11.8823" stroke="#BFBFC0" stroke-width="1.56034" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <div data-i18n-key-innertext="emoji-tooltip-msg" class="chat-tooltip-wrapper">Insert an Emoji</div>
                    </div>
                    <div id="chat-file-input" class="chat-tooltip">
                      <label htmlFor="imageupload">
                      <svg style="height: 18px; margin-bottom:-2px;" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.5307 8.72846L8.60184 15.8126C7.753 16.6805 6.60172 17.168 5.40128 17.168C4.20083 17.168 3.04956 16.6805 2.20072 15.8126C1.35187 14.9448 0.875 13.7677 0.875 12.5403C0.875 11.313 1.35187 10.1359 2.20072 9.26806L9.12961 2.18389C9.69551 1.60531 10.463 1.28027 11.2633 1.28027C12.0636 1.28027 12.8311 1.60531 13.397 2.18389C13.9629 2.76247 14.2808 3.54718 14.2808 4.36541C14.2808 5.18364 13.9629 5.96836 13.397 6.54693L6.46059 13.6311C6.17764 13.9204 5.79389 14.0829 5.39374 14.0829C4.99359 14.0829 4.60983 13.9204 4.32688 13.6311C4.04394 13.3418 3.88498 12.9495 3.88498 12.5403C3.88498 12.1312 4.04394 11.7389 4.32688 11.4496L10.728 4.91272" stroke="#C3C4C4" stroke-width="1.24828" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      </label>
                      <input
                        style="position: absolute; width: 40px; opacity: 0; left: 0px; right: 0px; height: 40px; cursor: pointer;"
                        type="file"
                        id="imageupload"
                        name="imageupload"
                        accept="image/gif, image/jpeg, image/jpg, image/png"
                      />
                      <div data-i18n-key-innertext="send-file-tooltip" class="chat-tooltip-wrapper">Send a File</div>
                    </div>
                    <button
                      type="submit"
                      style="
                        width: max-content;
                        background: transparent;
                        color: #999;
                        padding: 10px 0px;
                        border-radius: 0;
                        margin-right: 10px;
                      "
                      class="chat-submit chat-tooltip"
                      id="chat-submit"
                    >
                    <svg style="height: 18px; margin-bottom:-2px;" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.6738 2.42236L12.2126 18.0258L9.09186 11.0043L2.07031 7.88357L17.6738 2.42236Z" fill="#02203D" stroke="#02203D" stroke-width="1.24828" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M15.8139 3.98291L8.32422 11.4726" stroke="white" stroke-width="1.24828" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                      </svg>
                    </button>
                  </form>
                </div>`;
                    let chatInput = document.querySelector("[name='updateChatFunction']");
                    if (chatInput) {
                      if (chatInput["onsubmit"] === null) {
                        chatInput.onsubmit = (event) => {
                          this.updateChatFunction(event);
                        };
                      }
                      let textBox = document.querySelector("#chat-input");
                      if (textBox) {
                        if (chatInput["oninput"] === null) {
                          textBox.oninput = () => {
                            this.throttle("updateUserTyping", 2000);
                          };
                        }
                      }
                    }
                    this.checkFiles(this.traekImages);
                    this.updateNavigation();
                    this.unsubscribeChat();
                    this.unsubscribeChat = this.firebase
                      .firestore()
                      .collection("conversations")
                      .doc(this.propertyId + this.userKey)
                      .collection("chats")
                      .where("type", "in", ["text", "file"])
                      .orderBy("time")
                      .onSnapshot(({ docs }) => {
                        this.chats = docs;
                        let messages = document.querySelector(".chat-logs");
                        messages.innerHTML = null;
                        let tmpPastDay;
                        this.chats.forEach((doc, index) => {
                          let messageElement,
                            data = doc.data();
                          if (data.isClient === false && data.isDelivered === false && this.isChatBoxOpen === false) {
                            this.updateChatDelivery(doc.id);
                            this.showNotificationHandler();
                          }
                          if (index === docs.length - 1) {
                            if (this.isChatBoxOpen === true) {
                              this.updateChatRead();
                            }
                            if (data.isClient === false && data.isRead === false && this.isChatBoxOpen === false && this.autoOpenChatBox) {
                              this.openChatBoxHandler();
                            }
                          }
                          if (data.content) {
                            let regex = new RegExp(
                              /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/gim
                            );
                            let emailRegex = new RegExp(
                              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gim
                            );
                            data.content = data.content
                              .replace(regex, (url) => {
                                let hyperlink = url;
                                if (!hyperlink.match("^http")) {
                                  hyperlink = "http://" + hyperlink;
                                }
                                return '<a href="' + hyperlink + '" style="color:blue;" target="_new" rel="noopener noreferrer">' + url + "</a>";
                              })
                              .replace(emailRegex, (url) => `<a href="mailto:${url}">${url}</a>`);
                          }
                          let ms = new Date(data.time.seconds * 1000);
                          let day = new Date(ms.getFullYear(), ms.getMonth(), ms.getDate());
                          let newDate = false;
                          let options = {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          };
                          let currentDay = new Intl.DateTimeFormat("en-US", options).format(day);
                          if (tmpPastDay !== currentDay) {
                            newDate = true;
                            tmpPastDay = currentDay;
                          }
                          const chatTime = this.formatChatTime(data.time);
                          messageElement = document.createElement("div");
                          data.isClient ? messageElement.classList.add("chat-msg", "user") : messageElement.classList.add("chat-msg", "server");
                          data.isClient && document.querySelector("#chat-input").focus();
                          data.type === "file" &&
                            (messageElement.innerHTML =
                              `${newDate ? `<div class="cm-msg-date">` + tmpPastDay + "</div>" : ""}` +
                              `<div class="cm-msg-text"><img src="${data.url}" name="imageOnClick" data-url='${data.url}'" class="image"></img><br/><div class="chat-img-text"></div>
                              <span class="chatbox-msges-time">${chatTime}</span><div>`) &&
                            (messageElement.onclick = () => this.imageOnClick(data.url));
                          data.type === "text" &&
                            (messageElement.innerHTML =
                              `${newDate ? `<div class="cm-msg-date">` + tmpPastDay + "</div>" : ""}` +
                              `<div class="cm-msg-text">${data.content}
                              <span class="chatbox-msges-time">${chatTime}</span></div>`);
                          messages.appendChild(messageElement);
                          this.handleChatBoxScroll();
                        });
                      });
                  } else {
                    document.querySelector("#traek-main-content").innerHTML = `<div id="chatLogs" class="chat-logs">
                  <div class="traek-detail-box">
                      <div class="traek-detail-input">
                          <form name="addUserData">
                              <p data-i18n-key-innertext="name-placeholder" class="prechat-body-label">
                              Your name
                              </p>
                              <input data-i18n-key-placeholder="name-placeholder" type="text" name="traek-name" id="chat-input" placeholder="Your name" required />
                              <p data-i18n-key-innertext="email-placeholder" class="prechat-body-label">
                              Your email address
                              </p>
                              <input data-i18n-key-placeholder="email-placeholder" type="email" id="chat-input" name="traek-email" placeholder="Your email address"
                                  required />
                              <button data-i18n-key-innertext="chat-button-label" class="chat-submit" id="chat-submit">
                                  Start Chat
                              </button>
                              </form>
                              ${this.chatWidget.chat_initiation
                        ? `<div class="skip-div"><label data-i18n-key-innertext="skip-chat-initiation" class="skip-button" name="onSkipHandler">Skip</label></div>`
                        : ""
                      }
                      </div>
                  </div>
                  <div style="background: #F8F9FF;color: #4f4f4f;font-size: 12px;text-align: center;padding: 8px 0; position: absolute; width:100%; bottom: 0; left: 0; display: flex; justify-content: center; align-items: center;">
                    <span data-i18n-key-innertext="powered-by-label">Powered by</span> 
                    <a style="color: #4f4f4f;text-decoration: none; display:flex;" href="https://www.traek.io/" target="_blank">
                    <svg style="margin: 0px 5px; position:relative; top:2px;" width="14" height="14" viewBox="0 0 37 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M36.6553 8.8407L22.706 15.5503C22.3534 15.7199 22.1292 16.0766 22.1292 16.4679V37.1552H32.5825C34.8319 37.1552 36.6553 35.3317 36.6553 33.0824V8.8407ZM14.5255 37.1552V16.4678C14.5255 16.0765 14.3013 15.7199 13.9487 15.5503L0 8.84093V33.0824C0 35.3317 1.82346 37.1552 4.07281 37.1552H14.5255Z" fill="#A5ACC7"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.07281 0.5C1.82346 0.5 0 2.32346 0 4.57281V5.82483C0 5.95205 0.0892323 6.05933 0.203876 6.11448L16.35 13.8808L16.4942 13.9501C16.8468 14.1197 17.0711 14.4764 17.0711 14.8677V15.0277V35.899C17.0711 36.5928 17.6336 37.1553 18.3274 37.1553C19.0212 37.1553 19.5837 36.5928 19.5837 35.899V15.0278V14.8678C19.5837 14.4765 19.8079 14.1198 20.1605 13.9502L20.3048 13.8808L36.4509 6.11453C36.5658 6.05923 36.6553 5.95173 36.6553 5.82421V4.57281C36.6553 2.32346 34.8319 0.5 32.5825 0.5H4.07281Z" fill="url(#paint0_linear_0_1)"/>
                        <defs>
                        <linearGradient id="paint0_linear_0_1" x1="12" y1="1.81798e-06" x2="18.5" y2="37" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#5C59FB"/>
                        <stop offset="1" stop-color="#9AA4FF"/>
                        </linearGradient>
                        </defs>
                    </svg>
                    <span data-innertext="traek-label">Traek.io</span>
                    </a>
                </div>
              </div>`;
                    document.querySelector("#traek-chat-header").innerHTML = `
                  <div class="chat-header">
                  <div class="chat-box-header">
                  <span class="chat-box-toggle" name="closeChatBoxHandlerToggle">
                    <svg
                      style="height: 15px"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                  <p style="font-family: 'Inter', sans-serif;
                  font-weight: 500;
                  font-size: 17px;
                  color: #ffffff;
                  line-height: 1.5;
                  padding: 24px 20px 24px 20px;">
                    ${this.chatWidget?.header_content || this.headerContent}
                  </p>
                </div></div>`;
                    let form = document.querySelector('[name="addUserData"]');
                    if (form) {
                      if (form["onsubmit"] === null) {
                        form.onsubmit = (event) => {
                          event.preventDefault();
                          this.addUserData(event);
                        };
                      }
                    }
                  }
                  this.localization();
                  let onSkipHandler = document.querySelector("[name='onSkipHandler']");
                  if (onSkipHandler) {
                    if (onSkipHandler["onclick"] === null) {
                      onSkipHandler.onclick = (event) => {
                        this.onSkipHandler();
                      };
                    }
                  }
                  let checkFilesToggle = document.querySelector("#imageupload");
                  if (checkFilesToggle) {
                    if (checkFilesToggle["onchange"] === null) {
                      checkFilesToggle.onchange = (event) => {
                        this.checkFiles(event.target.files);
                      };
                    }
                  }
                  document.querySelectorAll('[name="closeChatBoxHandlerToggle"]').forEach((element) => {
                    if (element["onclick"] === null) {
                      element.onclick = () => this.closeChatBoxHandler();
                    }
                  });
                });
            })
            .catch((error) => {
              console.log(error.message);
            });
        };

        App.RealtimeAnalytics.prototype.setUserStatus = function ({ status }) {
          if (this.isTabOpen === true) {
            let payload = JSON.stringify({
              status,
              ipAddress: this.ipAddress,
              currentPageUrl: this.currentPageUrl,
              currentPageTitle: this.currentPageTitle,
              referrer: this.referrer,
              propertyId: this.propertyId,
              userKey: this.userKey,
              userAgent: this.userAgent,
              sessionKey: this.sessionKey,
            });
            navigator.sendBeacon(this.hostUrl + "/api/realtime/update", payload);
          }
        };

        App.RealtimeAnalytics.prototype.updateChatDelivery = function (id) {
          if (this.initiated) {
            this.firebase
              .firestore()
              .collection("conversations")
              .doc(this.propertyId + this.userKey)
              .collection("chats")
              .doc(id)
              .set({ isDelivered: true }, { merge: true });
          }
        };

        App.RealtimeAnalytics.prototype.updateChatRead = function () {
          if (this.initiated) {
            let notReadChats = this.chats.filter((doc) => {
              let { isRead, isClient } = doc.data();
              return isRead === false && isClient === false;
            });
            if (notReadChats.length > 0) {
              let batch = this.firebase.firestore().batch();
              notReadChats.forEach((doc) => {
                batch.update(doc.ref, {
                  isRead: true,
                  isDelivered: true,
                });
              });
              batch.commit();
            }
          }
        };

        App.RealtimeAnalytics.prototype.showNotificationHandler = function () {
          parent.postMessage({ target: "traekAnalytics", action: "showNotification" }, "*");
        };

        App.RealtimeAnalytics.prototype.openChatBoxHandler = function () {
          this.isChatBoxOpen = true;
          this.autoOpenChatBox = false;
          parent.postMessage({ target: "traekAnalytics", action: "openChatBox" }, "*");
        };

        App.RealtimeAnalytics.prototype.handleChatBoxScroll = function () {
          let messageBox = document.querySelector(".chat-box-body");
          messageBox.scrollTo(0, messageBox.scrollHeight);
        };

        App.RealtimeAnalytics.prototype.chatBoxOpened = function () {
          this.updateChatRead();
          this.chatBoxEvent("Chat window Maximized");
          this.handleChatBoxScroll();
        };

        App.RealtimeAnalytics.prototype.chatBoxClosed = function () {
          this.chatBoxEvent("Chat window Minimized");
        };

        App.RealtimeAnalytics.prototype.chatBoxEvent = function (text) {
          if (this.initiated) {
            this.firebase
              .firestore()
              .collection("conversations")
              .doc(this.propertyId + this.userKey)
              .collection("chats")
              .doc()
              .set({
                type: "event",
                time: new Date(),
                content: text,
                isClient: true,
                receiver: this.propertyId,
                sender: this.userKey,
              });
          }
        };

        App.RealtimeAnalytics.prototype.closeChatBoxHandler = function () {
          this.isChatBoxOpen = false;
          parent.postMessage({ target: "traekAnalytics", action: "closeChatBox" }, "*");
        };

        App.RealtimeAnalytics.prototype.addUserData = function (e) {
          e.preventDefault();
          let name = document.querySelector("input[name='traek-name']").value.trim();
          let email = document.querySelector("input[name='traek-email']").value.trim();
          navigator.sendBeacon(
            this.hostUrl + "/api/chat/chatformsubmit",
            JSON.stringify({
              propertyId: this.propertyId,
              userKey: this.userKey,
              currentPage: this.currentPageTitle,
              userName: name,
              userEmail: email,
              skip: false,
            })
          );
        };

        App.RealtimeAnalytics.prototype.removeImage = function () {
          let imagePreview = document.querySelector("div[id='imagePreview']");
          imagePreview.innerHTML = null;
          imagePreview.style.display = "none";
          this.checkFiles([]);
        };

        App.RealtimeAnalytics.prototype.checkFiles = function (files) {
          let tmpFiles = [...files];
          this.traekImages = tmpFiles.filter((file) => {
            // CHECK SIZE OF IMAGES
            if (file.size > 3145728) {
              alert("File size should be less than 3MB");
              return false;
            } else {
              return true;
            }
          });
          let imagePreview = document.querySelector("div[id='imagePreview']");
          imagePreview.innerHTML = null;
          this.traekImages.forEach((file) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            let superThis = this;
            fileReader.addEventListener("load", function () {
              imagePreview.style.display = "block";
              imagePreview.innerHTML = `<div style="position:absolute;bottom:0;"><svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                id="removeImage"
                style="
                  height: 25px;
                  width: 25px;
                  position: absolute;
                  right: -26px;
                  color:red;
                  top: 23px;
                  cursor: pointer;
                "
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              
              <img src="${this.result}" class="" height="100" style="margin-top:25px; border-radius:5px;"/></div>`;
              let removeImageToggle = document.querySelector("#removeImage");
              if (removeImageToggle) {
                removeImageToggle.onclick = () => {
                  superThis.removeImage();
                };
              }
              this.handleChatBoxScroll();
            });
          });
        };

        App.RealtimeAnalytics.prototype.updateChatFunction = async function (e) {
          e.preventDefault();
          if (this.initiated) {
            let textBox = document.querySelector("#chat-input");
            let message = textBox.value.trim();
            let time = new Date();
            if (this.uploadingImage === false && this.traekImages.length > 0) {
              let imageMessage = message;
              message = null;
              this.traekImages.map(async (image) => {
                this.uploadingImage = true;
                await this.firebase
                  .storage()
                  .ref()
                  .child("images/" + this.userKey + "/" + new Date().getTime())
                  .put(image, {
                    contentType: image.type,
                  })
                  .then((snapshot) => snapshot.ref.getDownloadURL())
                  .then(async (url) => {
                    this.traekImages = [];
                    this.removeImage();
                    let payload = {
                      isDelivered: false,
                      isRead: false,
                      isClient: true,
                      content: imageMessage,
                      time,
                      receiver: this.propertyId,
                      sender: this.userKey,
                      type: "file",
                      url,
                    };
                    await this.firebase
                      .firestore()
                      .collection("conversations")
                      .doc(this.propertyId + this.userKey)
                      .collection("chats")
                      .doc()
                      .set(payload)
                      .then(() => {
                        this.firebase
                          .firestore()
                          .collection("conversations")
                          .doc(this.propertyId + this.userKey)
                          .set(
                            {
                              lastMessage: "Image",
                              updatedAt: new Date(),
                              isLastMessageSeen: false,
                            },
                            { merge: true }
                          );
                      })
                      .catch((error) => console.log(error.message));
                    this.uploadingImage = false;
                  })
                  .catch((error) => console.log(error.message));
              });
            }
            if (message) {
              this.firebase
                .firestore()
                .collection("conversations")
                .doc(this.propertyId + this.userKey)
                .collection("chats")
                .doc()
                .set({
                  isDelivered: false,
                  isRead: false,
                  isClient: true,
                  content: message,
                  time,
                  receiver: this.propertyId,
                  sender: this.userKey,
                  type: "text",
                })
                .then(() => {
                  this.firebase
                    .firestore()
                    .collection("conversations")
                    .doc(this.propertyId + this.userKey)
                    .set(
                      {
                        lastMessage: message,
                        updatedAt: new Date(),
                        isLastMessageSeen: false,
                        typing: {
                          client: {
                            typing: false,
                          },
                        },
                      },
                      { merge: true }
                    );
                })
                .catch((error) => console.log(error.message));
            }
            textBox.value = null;
          }
        };

        App.RealtimeAnalytics.prototype.updateNavigation = function () {
          if (this.firebase && this.initiated && this.navigationUpdated === false) {
            this.navigationUpdated = true;
            this.firebase
              .firestore()
              .collection("conversations")
              .doc(this.propertyId + this.userKey)
              .collection("chats")
              .orderBy("time", "desc")
              .limit(1)
              .get()
              .then(({ docs }) => {
                let update = false;
                if (docs.length > 0) {
                  let doc = docs[0];
                  let data = doc.data();
                  if (data.type !== "navigation" || (data.type === "navigation" && data.currentPageUrl !== this.currentPageUrl)) {
                    update = true;
                  }
                } else {
                  update = true;
                }
                if (update) {
                  this.firebase
                    .firestore()
                    .collection("conversations")
                    .doc(this.propertyId + this.userKey)
                    .collection("chats")
                    .doc()
                    .set(
                      {
                        time: new Date(),
                        type: "navigation",
                        currentPageUrl: this.currentPageUrl,
                        currentPageTitle: this.currentPageTitle,
                      },
                      { merge: true }
                    );
                }
              });
          }
        };

        App.RealtimeAnalytics.prototype.onSkipHandler = function () {
          navigator.sendBeacon(
            this.hostUrl + "/api/chat/chatformsubmit",
            JSON.stringify({
              propertyId: this.propertyId,
              userKey: this.userKey,
              currentPage: this.currentPageTitle,
              userName: null,
              userEmail: null,
              skip: true,
            })
          );
        };

        App.RealtimeAnalytics.prototype.imageOnClick = function (url) {
          let params = "width=" + screen.width;
          params += ", height=" + screen.height;
          params += ", top=0, left=0";
          params += ", fullscreen=yes";
          params += ", directories=no";
          params += ", location=no";
          params += ", menubar=no";
          params += ", resizable=no";
          params += ", scrollbars=no";
          params += ", status=no";
          params += ", toolbar=no";
          let newwin = window.open(url, "FullWindowAll", params);
          if (window.focus) {
            newwin.focus();
          }
        };
      })(Traek);
      new Traek.RealtimeAnalytics().init();
    }
  },
  false
);
