const isLive = !window.location.origin.includes("localhost");

(function () {
  if (typeof Traek === "undefined") {
    Traek = {};
  }
  Traek.namespace = function () {
    if (arguments.length == 0) {
      return;
    }
    var namespace = {};
    for (var i = 0, a = arguments; i < a.length; i = i + 1) {
      var nslvl = a[i].split(".");
      namespace = Traek;
      for (var j = nslvl[0] == "Traek" ? 1 : 0; j < a[i].length; j = j + 1) {
        namespace[nslvl[j]] = namespace[nslvl[j]] || {};
        namespace = namespace[nslvl[j]];
      }
    }
    return namespace;
  };
  var $debug = false;
  Traek.register = function (module, myClass, ns) {
    var namespace = Traek[ns];
    if (!namespace && ns) {
      namespace = Traek.namespace(ns);
    }
    if (namespace && !namespace[module]) {
      namespace[module] = myClass || {};
    } else if (!namespace && !Traek[module]) {
      Traek[module] = myClass;
    }
    return namespace;
  };
  Traek.log = function () {
    if (window.console && $debug) {
      window.console.log.apply(window.console, arguments);
    }
  };
  Traek.warn = function () {
    if (window.console && $debug) {
      window.console.warn.apply(window.console, arguments);
    }
  };
  Traek.error = function () {
    if (window.console && $debug) {
      window.console.error.apply(window.console, arguments);
    }
  };
  Traek.info = function () {
    if (window.console && $debug) {
      window.console.info.apply(window.console, arguments);
    }
  };
  Traek.setDebugOn = function () {
    $debug = true;
  };
})();

(function (App) {
  App.TraekAnalytics = function (apiKey, hostUrl, cdnUrl) {
    if (sessionStorage.getItem("referrer")) {
      this.referrer = sessionStorage.getItem("referrer");
    } else {
      this.referrer = document.referrer || "direct";
      sessionStorage.setItem("referrer", document.referrer || "direct");
    }
    this.heatmapData = {};
    this.apiKey = apiKey;
    // this.allowLeads = false;
    // this.allowSession = false;
    this.allowForms = false;
    this.type = "";
    this.userKey = localStorage.getItem("traek_user_key");
    this.sessionKey = sessionStorage.getItem("SESSION_KEY");
    this.ip = sessionStorage.getItem("ip");
    this.firebaseAccessToken = null;
    this.visitedTime = new Date();
    this.callApi = true;
    this.propertyId = null;
    this.websiteUrl = null;
    this.pageTitle = document.title;
    this.pageUrl = document.URL.replace(/\/$/, "");
    this.userAgent = navigator.userAgent;
    this.chatWidget = null;
    this.hostUrl = hostUrl;
    this.cdnUrl = cdnUrl;
    this.elementUrlData = null;
    this.isLoading = false;
    this.heatmaps = [];
    this.allowHeatmaps = false;
    this.newVisit = true;
    this.allowSessionRecord = true;
    this.isSessionAPIInProgress = false;
  };

  const SAVE_RECORDING_INTERVAL_TIME = 15 * 1000; // 15 second

  // add into session
  App.TraekAnalytics.prototype.sessionSet = function (
    key,
    value,
    expirationInMin = 30
  ) {
    let expirationDate = new Date(
      new Date().getTime() + 60000 * expirationInMin
    );
    let newValue = {
      value,
      expirationDate: expirationDate.toISOString(),
    };

    this.sessionKey = value;
    // // clear indexDB store on new Session create
    clearStore();

    this.recordSessions();

    window.sessionStorage.setItem("isSnapshotCaptured", "false");
    window.sessionStorage.setItem("SESSION_KEY", value);
    window.sessionStorage.setItem(key, JSON.stringify(newValue));
  };

  // get from session (if the value expired it is destroyed)
  App.TraekAnalytics.prototype.sessionGet = async function (key) {
    const stringValue = window.sessionStorage.getItem(key);

    if (stringValue !== null) {
      const value = JSON.parse(stringValue);
      const expirationDate = new Date(value.expirationDate);

      if (typeof value.value !== "undefined" && expirationDate > new Date()) {
        return value.value;
      } else {
        const sessionKey = await this.generateKey();

        this.sessionSet("SESSION_KEY_OBJ", sessionKey);
      }
    }
    return null;
  };

  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  var indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;
  var baseName = "TRT";
  var storeName = "events";

  function logerr(err) {
    console.log("logerr", err);
  }

  function connectDB(f) {
    // Open (or create) the database
    var request = indexedDB.open(baseName, 1);
    request.onerror = logerr;
    request.onsuccess = function () {
      f(request.result);
    };
    request.onupgradeneeded = function (e) {
      //console.log("running onupgradeneeded");
      var Db = e.currentTarget.result; //var Db = e.target.result;

      //uncomment if we want to start clean
      //if(Db.objectStoreNames.contains(storeName)) Db.deleteObjectStore("note");

      //Create store
      if (!Db.objectStoreNames.contains(storeName)) {
        Db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
      }
      connectDB(f);
    };
  }

  function getAll(f) {
    connectDB(function (db) {
      var rows = [],
        store = db.transaction([storeName], "readonly").objectStore(storeName);

      if (store.mozGetAll)
        store.mozGetAll().onsuccess = function (e) {
          f(e.target.result);
        };
      else
        store.openCursor().onsuccess = function (e) {
          var cursor = e.target.result;
          if (cursor) {
            rows.push(cursor.value);
            cursor.continue();
          } else {
            f(rows);
          }
        };
    });
  }

  function add(obj, info) {
    info = typeof info !== "undefined" ? false : true;
    connectDB(function (db) {
      var transaction = db.transaction([storeName], "readwrite");
      var objectStore = transaction.objectStore(storeName);
      var objectStoreRequest = objectStore.add(obj);
      objectStoreRequest.onerror = logerr;
      objectStoreRequest.onsuccess = function () {
        // console.info("Success Add", objectStoreRequest.result);
      };
    });
  }

  function clearStore() {
    connectDB(function (db) {
      var transaction = db.transaction([storeName], "readwrite");
      var objectStore = transaction.objectStore(storeName);
      var objectStoreRequest = objectStore.clear();
      objectStoreRequest.onerror = logerr;
      objectStoreRequest.onsuccess = function () {
        // console.log("Store cleared");
      };
    });
  }

  App.TraekAnalytics.prototype.recordSessions = function () {
    if (typeof rrwebRecord !== "undefined") {
      rrwebRecord({
        emit(event) {
          try {
            if (event) {
              add(event);
            }
          } catch (error) {
            console.error("rrwebRecord error =>", error);
          }
        },
        recordCanvas: true,
        inlineStylesheet: true,
        // recordCrossOriginIframes: true,
        // inlineImages: true,
        sampling: {
          // do not record mouse movement
          // mousemove: false,
          // do not record mouse interaction
          // mouseInteraction: false,
          // set the interval of scrolling event
          // scroll: 150, // do not emit twice in 150ms
          // set the interval of media interaction event
          // media: 800,
          // set the timing of record input
          input: "last", // When input mulitple characters, only record the final input
        },
      });
    }
  };

  App.TraekAnalytics.prototype.saveSessionRecording = async function (
    isFormSession = false
  ) {
    await this.sessionGet("SESSION_KEY_OBJ");

    const {
      propertyId,
      userKey,
      sessionKey,
      hostUrl,
      ip,
      userAgent,
      pageUrl,
      pageTitle,
    } = this;

    //get data

    getAll(async (events) => {
      const isExistsSnapshotSession =
        window.sessionStorage.getItem("isSnapshotCaptured") === "true";

      const isExistsSnapshotObject = events.findIndex(({ type }) => type === 4);

      if (isExistsSnapshotSession || isExistsSnapshotObject >= 0) {
        if (events?.length > 0) {
          const url = hostUrl + "/api/session-recording";
          const payload = {
            data: events,
            propertyId,
            userKey,
            sessionKey,
            ip,
            userAgent,
            pageUrl,
            page: pageTitle,
            isFormSession,
          };

          const requestOptions = {
            method: "POST",
            body: JSON.stringify(payload),
          };

          fetch(url, requestOptions);
          clearStore();

          window.sessionStorage.setItem("isSnapshotCaptured", "true");
        }
      } else {
        window.sessionStorage.setItem("isSnapshotCaptured", "false");
        console.info(
          "Session recording has no snapshot object, restart recording"
        );
        this.recordSessions();
      }
    });
  };

  App.TraekAnalytics.prototype.captureHeatmaps = function () {
    setInterval(() => {
      this.saveHeatmap();
    }, 10 * 1000);
    function getDomPath(el) {
      if (!el) {
        return;
      }
      var stack = [];
      var isShadow = false;
      while (el.parentNode != null) {
        var sibCount = 0;
        var sibIndex = 0;
        for (var i = 0; i < el.parentNode.childNodes.length; i++) {
          var sib = el.parentNode.childNodes[i];

          if (sib.nodeName == el.nodeName) {
            if (sib === el) {
              sibIndex = sibCount;
            }
            sibCount++;
          }
        }
        var nodeName = el.nodeName.toLowerCase();

        if (isShadow) {
          nodeName += "::shadow";
          isShadow = false;
        }

        if (sibCount > 1) {
          stack.unshift(nodeName + ":nth-of-type(" + (sibIndex + 1) + ")");
        } else {
          stack.unshift(nodeName);
        }

        el = el.parentNode;

        if (el.nodeType === 11) {
          isShadow = true;
          el = el.host;
        }
      }
      stack.splice(0, 1);
      return stack.join(" > ");
    }

    function getCoords(elem) {
      let box = elem.getBoundingClientRect();
      return {
        clientHeight: box.height,
        clientWidth: box.width,
      };
    }

    document.addEventListener(
      "click",
      ({ target, offsetX, offsetY }) => {
        let { clientHeight, clientWidth } = getCoords(target);

        if (!this.heatmapData.click) {
          this.heatmapData.click = [];
        }
        if (target && target instanceof Element) {
          const domPath = getDomPath(target);
          let ValidDomPath = document.querySelector(domPath);
          if (ValidDomPath) {
            this.heatmapData.click.push({
              p: domPath,
              x: (offsetX * 100) / clientWidth,
              y: (offsetY * 100) / clientHeight,
              h: window.innerHeight,
              w: window.innerWidth,
            });
          }
        }
      },
      true
    );
    let trackData = false;
    setInterval(function () {
      trackData = true;
    }, 50);

    document.onmousemove = ({ target, offsetX, offsetY }) => {
      if (trackData) {
        let { clientHeight, clientWidth } = getCoords(target);

        if (!this.heatmapData.move) {
          this.heatmapData.move = [];
        }

        this.heatmapData.move.push({
          p: getDomPath(target),
          x: (offsetX * 100) / clientWidth,
          y: (offsetY * 100) / clientHeight,
          h: window.innerHeight,
          w: window.innerWidth,
        });
        trackData = false;
      }
    };
  };

  App.TraekAnalytics.prototype.saveHeatmap = function () {
    if (Object.keys(this.heatmapData).length > 0 && this.allowHeatmaps) {
      this.heatmaps
        .filter(({ url }) => url === this.pageUrl)
        .forEach(({ _id }) => {
          let url = this.hostUrl + "/api/heatmaps/save";
          var myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");

          const raw = JSON.stringify({
            propertyId: this.propertyId,
            heatmapId: _id,
            events: this.heatmapData,
            userKey: this.userKey,
            newVisit: this.newVisit,
          });

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
          };
          fetch(url, requestOptions);
        });
      this.newVisit = false;
    }
    this.heatmapData = {};
  };

  App.TraekAnalytics.prototype.getUserIp = async function () {
    const getIpFromIpify = async () => {
      try {
        const response = await fetch("https://api.ipify.org/?format=json");
        const { ip } = await response.json();
        return ip;
      } catch (error) {
        return null;
      }
    };

    if (RTCPeerConnection) {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            {
              urls: "stun:stun.l.google.com:19302",
            },
          ],
        });
        pc.createDataChannel("");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return await new Promise((resolve) => {
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              const match = event.candidate.candidate.match(
                /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/
              );
              if (match) {
                pc.close();
                resolve(match[0]);
              }
            }
          };
          setTimeout(() => {
            pc.close();
            resolve(null);
          }, 5000);
        });
      } catch (e) {
        return getIpFromIpify();
      }
    } else {
      return getIpFromIpify();
    }
  };
  App.TraekAnalytics.prototype.generateKey = function () {
    return fetch(this.hostUrl + "/api/generaterandomkey", {
      credentials: "same-origin",
    })
      .then((data) => data.json())
      .then(({ key }) => key)
      .catch((error) => {
        console.error("generateKey", error.message);
      });
  };

  function uploadVisitorRecords(url) {
    let visitors = JSON.parse(localStorage.getItem("visitors")) || [];

    const hostUrl = url + "/api/trackdata";
    navigator.sendBeacon(
      hostUrl,
      JSON.stringify({ visits: visitors, isBulkLeads: true })
    );

    localStorage.setItem("visitors", JSON.stringify([]));
  }

  App.TraekAnalytics.prototype.callFeedsApi = async function () {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const sessionKey = await this.sessionGet("SESSION_KEY_OBJ");

    const payload = {
      propertyId: this.propertyId,
      pageTitle: this.pageTitle,
      pageUrl: this.pageUrl,
      referrer: this.referrer,
      sessionKey,
      ip: this.ip,
      userKey: this.userKey,
    };

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload),
    };

    const hostUrl = isLive ? this.hostUrl : "http://localhost:3333";
    fetch(hostUrl + "/api/leads/feeds", requestOptions).catch((error) =>
      console.error("callFeedsApi error", error)
    );
  };

  // add leads / visitor logs to table on tab change/close, page change
  App.TraekAnalytics.prototype.callTrackingApi = async function () {
    const sessionKey = await this.sessionGet("SESSION_KEY_OBJ");

    try {
      const hostUrl = this.hostUrl + "/api/trackdata";
      const payload = {
        propertyId: this.propertyId,
        time: new Date() - this.visitedTime,
        pageTitle: this.pageTitle,
        pageUrl: this.pageUrl,
        referrer: this.referrer,
        sessionKey,
        ip: this.ip,
        userKey: this.userKey,
        userAgent: this.userAgent,
      };

      if (this.callApi) {
        if (this.type !== "isp") {
          navigator.sendBeacon(hostUrl, JSON.stringify(payload));
        }
      }

      navigator.sendBeacon(
        hostUrl,
        JSON.stringify({ ...payload, isVisitor: true })
      );
    } catch (error) {
      console.error("add leads error =>", error);
    }
  };

  App.TraekAnalytics.prototype.trackForms = function () {
    // allow form tracking if allow forms flag enabled
    console.log("this.allowForms =>", this.allowForms);

    if (this.allowForms) {
      let ignore = [
        "submit",
        "reset",
        "password",
        "file",
        "image",
        "radio",
        "checkbox",
        "button",
        "hidden",
      ];
      let sensitive = [
        "credit card",
        "card number",
        "expiration",
        "expiry",
        "ccv",
        "cvc",
        "cvv",
        "secure code",
        "mastercard",
        "american express",
        "amex",
        "cc-num",
        "cc-number",
        "g-recaptcha-response",
        "recaptcha",
      ];
      try {
        let forms = document.querySelectorAll("form");

        console.log("forms =>", forms);

        function formSubmitted(e, form, data, cb) {
          const formName = e.currentTarget.name.value;
          const formId = e.currentTarget.id;

          let formData = {
            sessionKey: data.sessionKey,
            userKey: data.userKey,
            userIp: data.ip,
            propertyId: data.propertyId,
            formName,
            formId,
            elements: [],
            referrer: data.referrer,
            page: data.pageTitle,
            pageUrl: data.pageUrl,
            userAgent: data.userAgent,
          };
          let checkEmpty = [];
          for (const element of form) {
            let type = element.type;
            let tag = element.tagName;
            let name = element.name;
            let label =
              element?.labels?.length > 0
                ? element?.labels[0]?.innerText
                : name || "";
            for (let i = 0; i < sensitive.length; i++) {
              if (label.match(new RegExp(sensitive[i], ""))) {
                continue;
              }
            }
            let elementObject = { tag, type, label, name };
            const checkRequiredOrEmpty = (value) => {
              if (value === "" || value === null || value === undefined) {
                checkEmpty.push(null);
              } else {
                checkEmpty.push(true);
              }
            };

            if (tag === "TEXTAREA") {
              if (
                label !== "g-recaptcha-response" &&
                name !== "g-recaptcha-response"
              ) {
                elementObject.value = element.value;
                formData.elements.push(elementObject);
              }
            } else if (tag === "SELECT") {
              for (const option of element.selectedOptions) {
                if (!elementObject.value) {
                  elementObject.value = [];
                }
                elementObject.value.push(option.value);
              }
              formData.elements.push(elementObject);
            } else if (tag === "INPUT") {
              const excludedValues = ["g-recaptcha-response", "recaptcha"];

              if (
                !excludedValues.includes(label) &&
                !excludedValues.includes(name)
              ) {
                switch (type) {
                  case "radio":
                    if (element.checked) {
                      elementObject.value = element.value;
                      formData.elements.push(elementObject);
                    }
                    break;
                  case "checkbox":
                    if (element.checked) {
                      let checkIndex = formData.elements.findIndex(
                        (element) =>
                          element.type === type && element.name === name
                      );
                      if (checkIndex === -1) {
                        elementObject.value = [];
                        elementObject.value.push(element.value);
                        formData.elements.push(elementObject);
                      } else {
                        elementObject = formData.elements[checkIndex];
                        elementObject.value.push(element.value);
                        formData.elements[checkIndex] = elementObject;
                      }
                    }
                    break;
                  default:
                    if (!ignore.find((val) => val === type)) {
                      elementObject.value = element.value;
                      formData.elements.push(elementObject);
                      checkRequiredOrEmpty(element.value);
                    }
                    break;
                }
              }
            }
          }
          if (checkEmpty.every((data) => data === true)) {
            navigator.sendBeacon(
              data.hostUrl + "/api/track/forms",
              JSON.stringify(formData)
            );
          }

          cb(true);
        }
        const _this = this;

        forms.forEach((form) => {
          form.onsubmit = function (e) {
            formSubmitted(e, form, _this, () => {
              uploadVisitorRecords(_this.hostUrl);
              _this.saveSessionRecording(true);
            });
          };
        });
      } catch (error) {
        console.error("trackForms", error);
      }
    }
  };

  App.TraekAnalytics.prototype.trackUserData = async function () {
    // const eventStateObj = JSON.parse(localStorage.getItem("eventState")) || null;
    window.sessionStorage.setItem("isSnapshotCaptured", "false");

    if (
      this.userAgent.match(
        /bot|spider|crawler|headlesschrome|phantomjs|bingpreview/i
      )
    )
      return;

    if (!this.userKey) {
      let userKey = await this.generateKey();
      localStorage.setItem("traek_user_key", userKey);
      this.userKey = userKey;
    }

    if (!this.sessionKey) {
      let sessionKey = await this.generateKey();
      sessionStorage.setItem("SESSION_KEY", sessionKey);
      this.sessionSet("SESSION_KEY_OBJ", sessionKey);
      this.sessionKey = sessionKey;
    }

    if (!this.ip) {
      let ip = await this.getUserIp();
      sessionStorage.setItem("ip", ip);
      this.ip = ip;
    }

    this.isLoading = true;

    try {
      let propertyData = sessionStorage.getItem("propertyData");

      if (!propertyData) {
        let response = await fetch(
          this.hostUrl + "/api/properties/property/" + this.apiKey,
          {
            method: "POST",
            body: JSON.stringify({
              api_key: this.apiKey,
              ip: this.ip,
              originUrl: this.pageUrl,
              userKey: this.userKey,
            }),
          }
        );

        response = JSON.stringify(await response.json());
        sessionStorage.setItem("propertyData", response);
        propertyData = response;
      }

      const {
        realtime,
        property_id,
        verified,
        //shouldAllowLead,
        //shouldAllowSession,
        chat_widget,
        forms,
        website_url,
        // type,
        heatmaps,
        firebaseAccessToken,
      } = JSON.parse(propertyData);

      Object.assign(this, {
        propertyId: property_id,
        chatWidget: chat_widget,
        websiteUrl: website_url,
        allowForms: forms,
        // type,
        heatmaps,
        firebaseAccessToken,
      });

      if (this.heatmaps?.length > 0) {
        this.allowHeatmaps = true;
        this.captureHeatmaps();
      }

      const url =
        window.location !== window.parent.location
          ? document.referrer
          : document.location.href;

      if (url !== "https://app.traek.io/") {
        this.getElementsData();
      }

      if (property_id && verified === true) {
        // this.allowLeads = shouldAllowLead;
        // this.allowSession = shouldAllowSession;
        this.callFeedsApi();
        this.trackForms();
        // this.callTrackingApi();

        if (realtime) {
          App.TraekAnalytics.currentObject = this;
          let realtimeSctipt = document.createElement("script");
          realtimeSctipt.src = this.cdnUrl + "/realtime-uat.js";
          realtimeSctipt.type = "text/javascript";
          document.head.appendChild(realtimeSctipt);
        }

        const sessionKey = await this.sessionGet("SESSION_KEY_OBJ");

        if (this.propertyId && this.userKey && sessionKey && this.ip) {
          window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              this.visitedTime = new Date();
            } else {
              this.callTrackingApi();
            }
            if (document.visibilityState === "hidden") {
              this.saveSessionRecording();
              this.allowSessionRecord = false;
            } else {
              this.allowSessionRecord = true;
            }
          });

          window.addEventListener("beforeunload", () => {
            this.saveHeatmap();
            this.callTrackingApi();
            this.callApi = false;
            this.saveSessionRecording();
          });

          const observer = new MutationObserver(() => {
            let pageTitle = document.title;

            const currentUrl = document.URL.replace(/\/$/, "");

            if (this.pageUrl !== currentUrl && this.pageTitle !== pageTitle) {
              this.pageUrl = currentUrl;
              this.pageTitle = pageTitle;
              this.visitedTime = new Date();
              this.newVisit = true;
              this.callTrackingApi();
              this.saveHeatmap();
              this.callFeedsApi();

              setTimeout(() => {
                this.trackForms();
              }, 2000);
            }
          });

          const config = { subtree: true, childList: true };
          observer.observe(document, config);
        }
      }
      if (property_id && verified === false) {
        navigator.sendBeacon(
          this.hostUrl + "/api/verifyscript",
          JSON.stringify({
            API_KEY: this.apiKey,
            PAGE_URL: this.pageUrl,
            IP: this.ip,
          })
        );
      }

      // load rrweb script
      const traekRRWebScript = document.createElement("script");
      traekRRWebScript.src =
        "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/record/rrweb-record.min.js";

      traekRRWebScript.onload = async () => {
        if (this.allowSessionRecord) {
          await this.recordSessions();
          this.callTrackingApi();

          setInterval(() => {
            console.info(
              "SAVE_RECORDING_INTERVAL_TIME =>",
              SAVE_RECORDING_INTERVAL_TIME
            );
            this.saveSessionRecording();
          }, SAVE_RECORDING_INTERVAL_TIME);

          // if (this.allowSession) {
          // } else {
          //   console.info("this.allowSession ,interval cancelled");
          // }
        }
      };
      document.head.appendChild(traekRRWebScript);
    } catch (error) {
      console.log(error.message);
    } finally {
      this.isLoading = false;
    }
  };

  App.TraekAnalytics.prototype.getElementsData = async function () {
    return;
    try {
      const fetchedUrls = await fetch(
        `${this.cdnUrl}/themes/bars/${this.websiteUrl}/elementUrls.json`
      );
      const urlsObject = Object.values(JSON.parse(await fetchedUrls.text()));
      this.elementUrlData = urlsObject;

      App.TraekAnalytics.currentObject = this;
      let elementsScript = document.createElement("script");
      elementsScript.src = this.cdnUrl + "/elements-uat.js";
      elementsScript.type = "text/javascript";
      document.head.appendChild(elementsScript);
    } catch (error) {
      console.error(
        "ERROR WHILE FETCHING ELEMENT URLS IN TRACKING-INIT-UAT",
        error
      );
    }
  };
})(Traek);

const apiKey = document
  .querySelector("script[id*=traek_script]")
  .id.split("&")[1];

const hostUrl = isLive ? "https://uat-app.traek.io" : "http://localhost:4200";
const assets = isLive
  ? "https://assets.traek.io"
  : `${window.location.origin}/uat`;

console.info("assets =>", assets);
console.info("hostUrl =>", hostUrl);

const traek = new Traek.TraekAnalytics(apiKey, hostUrl, assets).trackUserData();
