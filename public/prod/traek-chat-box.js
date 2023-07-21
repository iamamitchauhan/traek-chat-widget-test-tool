parent.postMessage({ target: "traekAnalytics", action: "getObject" }, "*");
window.addEventListener(
  "message",
  ({ data }) => {

    console.log('data => ', data);

    if (data?.target === "traekAnalytics" && data?.action === "traekObject") {
      window.Traek = {};

      (function (App) {
        App.RealtimeAnalytics = function () {
          const traek = JSON.parse(data.traekObject);

          this.unsubscribeChat = () => { };
          this.unsubscribeUser = () => { };
          this.hostUrl = traek.hostUrl;
          this.cdnUrl = traek.cdnUrl;
          this.isSendBtnDisabled = false;
          this.propertyId = traek.propertyId;
          this.ipAddress = traek.ip;
          this.userKey = traek.userKey;
          this.ablyChannelKey = traek.userKey;
          this.userTypingTimeout;
          this.currentPageUrl = traek.pageUrl;
          this.currentPageTitle = traek.pageTitle;
          this.referrer = traek.referrer;
          this.userAgent = traek.userAgent;
          this.sessionKey = traek.sessionKey;
          this.chatWidget = traek.chatWidget || {};
          this.firebaseAccessToken = traek.firebaseAccessToken;
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
          this.headerContent = "Chat with us! ";
          this.supportMessageContent = "How can I assist you? ";
          this.headerBackgroundColor = "#02203d";
          this.headerTextColor = "#FFFFFF";
          this.agentMessageBackground = "#f5f5f5";
          this.agentText = "#020619";
          this.visitorMessageBackground = "#4194e6";
          this.visitorText = "#FFFFFF";
          this.navigationUpdated = false;
          this.firebaseConfig = {
            apiKey: "AIzaSyDjPUu8bOEpaI9iNXGFpNLjvEoRG7ruo-A",
            authDomain: "traek-314011.firebaseapp.com",
            projectId: "traek-314011",
            storageBucket: "traek-314011.appspot.com",
            messagingSenderId: "671964768382",
            appId: "1:671964768382:web:9892b490817a80e3cf502f",
            measurementId: "G-QX1GVHV99X",
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

        App.RealtimeAnalytics.prototype.pageChangeHandler = function (newURL, newPageTitle) {
          if (this.currentPage !== newPageTitle) {
            this.currentPageUrl = newURL;
            this.currentPageTitle = newPageTitle;
            this.setUserStatus({ status: "active" });
          }
        };

        App.RealtimeAnalytics.prototype.init = function () {
          this.addStyling();
          this.addEmojiPicker();
          this.setUserStatus({ status: "active" });
          this.startRealtimeTraeking();
          // this.initAbly();

          const eventState = {
            isFormSubmitted: false,
          };

          localStorage.setItem("eventState", JSON.stringify(eventState));
          window.addEventListener("message", ({ data }) => {
            if (data?.target === "traekAnalytics") {
              switch (data.action) {
                case "chatBoxClosed":
                  this.chatBoxClosed();
                  break;
                case "chatBoxOpened":
                  this.chatBoxOpened();
                  break;
                case "pageChanged":
                  this.pageChangeHandler(data.newURL, data.newPageTitle);
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
                  this.init();
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

        App.RealtimeAnalytics.prototype.handleQuestionClick = function (question) {
          console.log("Clicked on question:", question);
        };

        App.RealtimeAnalytics.prototype.startRealtimeTraeking = async function () {
          this.firebase = firebase.initializeApp(this.firebaseConfig);
          console.log(' this.firebase => ', this.firebase);

          console.log('this.firebaseAccessToken => ', this.firebaseAccessToken);

          await this.firebase
            .auth()
            .signInWithCustomToken(this.firebaseAccessToken)
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
                        const setUserTyping = () => {
                          let ts = typing?.server?.timeStamp || {};
                          let currentTs = new Date().getTime();
                          let lastTypedTs = (ts.seconds || 0) * 1000;
                          let difference = currentTs - lastTypedTs;
                          if (difference < 4000) {
                            typingIndicator.classList.remove("hide");
                          } else {
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
                   <div> 
                   <div style="display: flex;align-items: center;">
                  <div class="chat-box-header-logo">
                    <img class="chat-logo" src=${this.chatWidget?.company_logo || this.companyLogo} alt="logo" />
                    <img class="chat-user-logo" src=${this.chatWidget?.support_executive_image || this.supportExecutiveImage} alt="executive-image" />
                    <img class="chat-user-AIlogo" src="https://assets.traek.io/AI-icons-bot.png" alt="executive-image" />
                    <span class="chatbox-head-active-dot"></span>
                </div>
                  <div class="chat-header-text">
                    <div class="chat-online chat-offline"></div>
                    <div class="line-truncate-2">${this.chatWidget?.support_message || this.supportMessageContent}</div>
                  </div>
                  </div>
                  </div>
                <span class="chat-box-toggle" name="closeChatBoxHandlerToggle">
                  <svg
                    style="height: 22px"
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
                </div>
                    `;
                    document.querySelector("#traek-main-content").innerHTML = `<div class="chat-box-body">

                    <div id="typing" class="typing hide">Typing...</div>

                    <div id="imagePreview" style="display: none;"></div>

                    <div id="chatLogs" class="chat-logs"></div> 
                  </div>

                  
                <div class="chatbox-inner-wrapper">
                    <div id="questions">
                        <div class="button-container"></div>
                    </div>

                <div class="chat-input-wrap chat-msg-input-box">
                  <form name="updateChatFunction">
                    <textarea
                      type="text"
                      id="chat-input"
                      autocomplete="off"
                      placeholder="Write a message..."
                    ></textarea>
                    
                    <button
                      type="submit"
                      style="
                        width: max-content;
                        background: transparent;
                        color: #999;
                        border-radius: 0;
                        padding: 0;
                        position: relative;
                        top: 2px;
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
                </div>
                
                  <div style="background: #F8F9FF;color: #4f4f4f;font-size: 12px;text-align: center; height: 30px; padding: 8px 0; width:100%; display: flex; justify-content: center; align-items: center;">
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

                </div>
                
                `;

                    if (!this.chatWidget?.aiSettings?.isAiEnabled) {
                      var aiLogo = document.querySelector(".chat-user-AIlogo");
                      aiLogo.style.display = "none";
                    } else {
                      var humanLogo = document.querySelector(".chat-user-logo");
                      humanLogo.style.display = "none";
                    }

                    function getDivHeight() {
                      const div = document.querySelector(".button-container");
                      let height = div.clientHeight;
                      let temp = 350 + height;
                      let calculatedHeight = "calc(100vh - " + temp + "px)";
                      // document.querySelector(".chat-box-body").style.height =
                      //   calculatedHeight;
                    }
                    getDivHeight();

                    function wideTheInputBox() {
                      const tx = document.getElementById("chat-input");
                      tx.style.height = 0 + "px";
                      tx.addEventListener("input", OnInput, false);

                      function OnInput() {
                        this.style.height = 0;
                        this.style.height = this.scrollHeight + "px";
                      }
                    }
                    wideTheInputBox();

                    function submitOnEnter(event) {
                      if (event.which === 13 && !event.shiftKey) {
                        wideTheInputBox();
                        if (!event.repeat) {
                          const newEvent = new Event("submit", {
                            cancelable: true,
                          });
                          event.target.form.dispatchEvent(newEvent);
                        }

                        event.preventDefault(); // Prevents the addition of a new line in the text field
                      }
                    }

                    document.getElementById("chat-input").addEventListener("keydown", submitOnEnter);

                    let chatInput = document.querySelector("[name='updateChatFunction']");
                    if (chatInput) {
                      if (chatInput["onsubmit"] === null) {
                        chatInput.onsubmit = (event) => {
                          wideTheInputBox();
                          this.updateChatFunction(event);
                        };
                      }
                      let textBox = document.getElementById("chat-input");
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

                        this.chatWidget?.aiSettings?.isAiEnabled &&
                          this.chatWidget?.aiSettings?.initialMessages.length > 0 &&
                          this.chatWidget?.aiSettings?.initialMessages?.forEach((val) => {
                            if (val.length > 0) {
                              messageElement = document.createElement("div");
                              messageElement.classList.add("chat-msg", "server");
                              messageElement.innerHTML = `<div class="cm-msg-text">${val}</div>`;
                              messages.appendChild(messageElement);
                            }
                          });

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
                        if (this.isTyping) {
                          messages = document.querySelector(".chat-logs");
                          messageElement1 = document.createElement("div");
                          messageElement1.classList.add("chat-msg", "server");
                          messages.appendChild(messageElement1);
                          messageElement1.innerHTML = `<div id="typing" class="typing">typing...</div>`;
                        }
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
                  if (this.chatWidget?.aiSettings?.suggestedQuestions?.length > 0 && this.chatWidget?.aiSettings.isAiEnabled) {
                    this.chatWidget?.aiSettings?.suggestedQuestions?.forEach((que) => {
                      if (que.length > 0) {
                        let questionBtn = document.createElement("button");
                        questionBtn.textContent = que;
                        questionBtn.classList.add("suggested-question");
                        questionBtn.addEventListener("click", async () => {
                          if (!this.isTyping && !this.isSendBtnDisabled) {
                            let messages = document.querySelector(".chat-logs");
                            messageElement = document.createElement("div");
                            messageElement.classList.add("chat-msg", "user");
                            messages.appendChild(messageElement);
                            messageElement.innerHTML = `<div class="cm-msg-text">${que}</div>`;
                            questionBtn.classList.add("hideChips");

                            this.firebase
                              .firestore()
                              .collection("conversations")
                              .doc(this.propertyId + this.userKey)
                              .collection("chats")
                              .doc()
                              .set({
                                isDelivered: true,
                                isRead: true,
                                isClient: true,
                                content: que,
                                time: new Date(),
                                isAi: this.chatWidget?.aiSettings?.isAiEnabled || true,
                                receiver: this.propertyId,
                                sender: this.userKey,
                                type: "text",
                              });

                            this.isTyping = true;

                            if (this.chatWidget?.aiSettings.isAiEnabled) {
                              this.isSendBtnDisabled = true;
                              let response = await fetch(this.hostUrl + "/api/query", {
                                method: "POST",
                                body: JSON.stringify({
                                  propertyId: this.propertyId,
                                  userKey: this.userKey,
                                  currentPage: this.currentPageTitle,
                                  userName: null,
                                  userEmail: null,
                                  query: que,
                                  skip: true,
                                }),
                              });

                              const reader = response.body.getReader();
                              const decoder = new TextDecoder();
                              let done = false;
                              let text = "";

                              this.isTyping = false;
                              if (document.getElementById("typing")) {
                                let typing = document.getElementById("typing");
                                typing.remove();
                              }
                              App.RealtimeAnalytics.prototype.setUserStatus
                              let messages = document.querySelector(".chat-logs");
                              messageElement1 = document.createElement("div");
                              messageElement1.classList.add("chat-msg", "server");
                              messages.appendChild(messageElement1);

                              while (!done) {
                                const { value, done: doneReading } = await reader.read();
                                done = doneReading;
                                const chunkValue = decoder.decode(value);

                                text += chunkValue;

                                messageElement1.innerHTML = `<div class="cm-msg-text">${text}</div>`;
                              }

                              this.isSendBtnDisabled = false;

                              this.firebase
                                .firestore()
                                .collection("conversations")
                                .doc(this.propertyId + this.userKey)
                                .collection("chats")
                                .doc()
                                .set({
                                  isDelivered: true,
                                  isRead: true,
                                  isClient: false,
                                  content: text,
                                  time: new Date(),
                                  isAi: this.chatWidget?.aiSettings.isAiEnabled,
                                  receiver: this.userKey,
                                  sender: this.propertyId,
                                  type: "text",
                                });
                            }
                          }
                        });
                        const questionsDiv = document.querySelector("#questions");
                        if (questionsDiv) {
                          questionsDiv.appendChild(questionBtn);
                        }
                      }
                    });
                  }
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
          messageBox && messageBox.scrollTo(0, messageBox.scrollHeight);
        };

        App.RealtimeAnalytics.prototype.chatBoxOpened = function () {
          function getDivHeight() {
            const div = document.querySelector(".button-container");
            if (div) {
              let height = div.clientHeight;
              let temp = 350 + height;
              let calculatedHeight = "calc(100vh - " + temp + "px)";
              // document.querySelector(".chat-box-body").style.height =
              //   calculatedHeight;
            }
          }
          getDivHeight();
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
              currentPage: this.currentPageTitle || "Untitled",
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
          if (this.initiated && !this.isSendBtnDisabled) {
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
                      isAi: this.chatWidget?.aiSettings?.isAiEnabled || true,
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
                  isAi: this.chatWidget?.aiSettings?.isAiEnabled || true,
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

            if (this.chatWidget?.aiSettings?.isAiEnabled) {
              this.isTyping = true;
            }

            if (this.chatWidget?.aiSettings?.isAiEnabled) {
              this.isSendBtnDisabled = true;
              let response = await fetch(this.hostUrl + "/api/query", {
                method: "POST",
                body: JSON.stringify({
                  propertyId: this.propertyId,
                  userKey: this.userKey,
                  currentPage: this.currentPageTitle,
                  userName: null,
                  userEmail: null,
                  query: message,
                  skip: true,
                }),
              });

              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let done = false;
              let text = "";

              this.isTyping = false;

              while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);

                text += chunkValue;

                messageElement1.innerHTML = `<div class="cm-msg-text">${text}</div>`;
              }

              this.isSendBtnDisabled = false;

              this.firebase
                .firestore()
                .collection("conversations")
                .doc(this.propertyId + this.userKey)
                .collection("chats")
                .doc()
                .set({
                  isDelivered: true,
                  isRead: true,
                  isClient: false,
                  content: text,
                  time: new Date(),
                  isAi: this.chatWidget?.aiSettings.isAiEnabled,
                  receiver: this.userKey,
                  sender: this.propertyId,
                  type: "text",
                });
            }
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
              currentPage: this.currentPageTitle || "Untitled",
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

        // App.RealtimeAnalytics.prototype.initAbly = async function () {
        //   let AblyAppCDN = document.createElement("script");
        //   AblyAppCDN.src = "https://cdn.ably.com/lib/ably.min-1.js";
        //   document.head.appendChild(AblyAppCDN);

        //   let markDownCDN = document.createElement("script");
        //   markDownCDN.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
        //   document.head.appendChild(markDownCDN);

        //   let renderer;

        //   markDownCDN.onload = async () => {
        //     renderer = new marked.Renderer();
        //     renderer.link = function (href, title, text) {
        //       if (href.includes("mailto")) {
        //         href = href.replace(/(\S+@\S+\.\S+)/g, `<a target="_blank" href="$1">${text}</a>`);
        //       }
        //       return href;
        //     };
        //   };

        //   const ably = new Ably.Realtime.Promise("sRYtXw.DX5S_w:sQpaY7M2nlmeBN9vSiItdc-AHWhk2rK-1JV22jF-2yY");

        //   ably.connection.once("connected");
        //   const channel = ably.channels.get(this.ablyChannelKey);

        //   let temp = "";
        //   let renderMessage = "";

        //   await channel.subscribe((event) => {
        //     let chatSubmit = document.getElementById("chat-submit");
        //     chatSubmit.disabled = true;

        //     let messages = document.querySelector(".chat-logs");
        //     temp += event.data.token;

        //     if (!document.getElementById(event.data.interactionId)) {
        //       messageElement = document.createElement("div");
        //       messageElement.setAttribute("id", event.data.interactionId);
        //       messageElement.classList.add("chat-msg", "server");
        //       messages.appendChild(messageElement);
        //     } else {
        //       messageElement = document.getElementById(event.data.interactionId);
        //     }

        //     if (event.data.token == undefined) {
        //       temp = "";
        //     } else {
        //       if (typeof event.data.token !== "object") {
        //         if (document.getElementById("typing")) {
        //           let typing = document.getElementById("typing");
        //           typing.remove();
        //         }
        //         renderMessage = marked.parse(temp, { renderer: renderer });
        //         messageElement.innerHTML = `<div class="cm-msg-text">${renderMessage}</div>`;
        //       }
        //     }

        //     !this.submitAnswer &&
        //       setTimeout(() => {
        //         chatSubmit.disabled = false;
        //         this.submitAnswer = true;
        //       }, 8000);

        //     if (event.data.token === undefined) {
        //       chatSubmit.disabled = false;
        //       this.submitAnswer = true;

        //       this.firebase
        //         .firestore()
        //         .collection("conversations")
        //         .doc(this.propertyId + this.userKey)
        //         .collection("chats")
        //         .doc()
        //         .set({
        //           isDelivered: true,
        //           isRead: true,
        //           isClient: false,
        //           content: renderMessage,
        //           time: new Date(),
        //           isAi: this.chatWidget?.aiSettings?.isAiEnabled || true,
        //           receiver: this.userKey,
        //           sender: this.propertyId,
        //           type: "text",
        //         });
        //     }
        //   });
        // };
      })(Traek);
      new Traek.RealtimeAnalytics().initiateFirebase();
    }
  },
  false
);
