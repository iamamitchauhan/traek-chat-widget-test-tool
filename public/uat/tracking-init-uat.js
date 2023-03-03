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
    this.allowLeads = false;
    this.allowForms = false;
    this.type = "";
    this.userKey = localStorage.getItem("traek_user_key");
    this.sessionKey = sessionStorage.getItem("SESSION_KEY");
    this.ip = sessionStorage.getItem("ip");
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
    this.sessionRecord = localStorage.getItem("sessionrecords");
    this.allowSessionRecord = true;
  };


  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
  var baseName = "TRT";
  var storeName = "events";

  function logerr(err) {
    console.log(err);
  }

  function connectDB(f) {
    // Open (or create) the database
    var request = indexedDB.open(baseName, 1);
    request.onerror = logerr;
    request.onsuccess = function () {
      f(request.result);
    }
    request.onupgradeneeded = function (e) {
      //console.log("running onupgradeneeded");
      var Db = e.currentTarget.result;//var Db = e.target.result;

      //uncomment if we want to start clean
      //if(Db.objectStoreNames.contains(storeName)) Db.deleteObjectStore("note");

      //Create store
      if (!Db.objectStoreNames.contains(storeName)) {
        var store = Db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        //store.createIndex("NameIndex", ["name.last", "name.first"], { unique: false });
      }
      connectDB(f);
    }
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
          }
          else {
            f(rows);
          }
        };
    });
  }

  function add(obj, info) {
    info = typeof info !== 'undefined' ? false : true;
    connectDB(function (db) {
      var transaction = db.transaction([storeName], "readwrite");
      var objectStore = transaction.objectStore(storeName);
      var objectStoreRequest = objectStore.add(obj);
      objectStoreRequest.onerror = logerr;
      objectStoreRequest.onsuccess = function () {
        // console.info(objectStoreRequest.result);
      }
    });
  }

  function clearStore() {
    connectDB(function (db) {
      var transaction = db.transaction([storeName], "readwrite");
      var objectStore = transaction.objectStore(storeName);
      var objectStoreRequest = objectStore.clear();
      objectStoreRequest.onerror = logerr;
      objectStoreRequest.onsuccess = function () {
        console.log("Store cleared");
      }
    });
  }



  App.TraekAnalytics.prototype.recordSessions = function () {
    if (typeof rrwebRecord !== "undefined") {
      rrwebRecord({
        emit(event) {
          try {
            const newData = JSON.parse(localStorage.getItem("sessionrecords")) ?? [];
            newData.push(event);

            console.info('rrwebRecord event =>', event);
            if (event) {
              add(event);
            }

            getAll((events) => {
              console.info('All events =>', events);
            })

            // localStorage.setItem("sessionrecords", JSON.stringify(newData));
          } catch (error) {
            console.info("error =>", error);
            // localStorage.setItem("sessionrecords", JSON.stringify([event]));
          }
        },
        recordCanvas: true,
        // ignoreClasses: ["owl-dot", "owl-item", "active"],
        sampling: {
          // do not record mouse movement
          mousemove: true,
          // do not record mouse interaction
          mouseInteraction: false,
          // set the interval of scrolling event
          scroll: 150, // do not emit twice in 150ms
          // set the interval of media interaction event
          media: 800,
          // set the timing of record input
          input: 'last' // When input mulitple characters, only record the final input
        },
      });
    }
  };

  function sliceIntoChunks(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  async function sequentialCall(url, events, propertyId, userKey, sessionKey) {

    const eventsList = sliceIntoChunks(events, 300);
    for (let events of eventsList) {

      try {
        const requestOptions = {
          method: 'POST',
          body: JSON.stringify({ data: events, propertyId, userKey, sessionKey }),
        };

        const response = await fetch(url, requestOptions)
        const data = await response.json()

        if (data) {
          console.info('record saved =>');
        }
      } catch (error) {
        console.info('ERROR WHILE saving API CALL');
      }
    };

    clearStore();
    console.log('finish');
  }

  function saveSessionRecording({ propertyId, userKey, sessionKey, hostUrl }) {

    //get data

    console.info("call saveSessionRecording function ==================");

    const eventState = JSON.parse(localStorage.getItem("eventState")) || null;
    if (eventState?.isFormSubmitted) {
      getAll((events) => {
        if (events?.length > 0) {
          const url = hostUrl + "/api/session-recording";

          sequentialCall(url, events, propertyId, userKey, sessionKey);
        }
      });
    }
  }

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
        this.heatmapData.click.push({
          p: getDomPath(target),
          x: (offsetX * 100) / clientWidth,
          y: (offsetY * 100) / clientHeight,
          h: window.innerHeight,
          w: window.innerWidth,
        });
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

  App.TraekAnalytics.prototype.getUserIp = function () {
    return fetch("https://api.ipify.org/?format=json")
      .then((data) => data.json())
      .then(({ ip }) => ip);
  };
  App.TraekAnalytics.prototype.generateKey = function () {
    return fetch(this.hostUrl + "/api/generaterandomkey")
      .then((data) => data.json())
      .then(({ key }) => key)
      .catch((error) => {
        console.log(error.message);
      });
  };

  function uploadVisitorRecords(url) {
    let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
    const hostUrl = url + "/api/trackdata";
    navigator.sendBeacon(hostUrl, JSON.stringify({ visits: visitors, isBulkLeads: true }));

    localStorage.setItem("visitors", JSON.stringify([]));
  }

  App.TraekAnalytics.prototype.callFeedsApi = function () {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      propertyId: this.propertyId,
      pageTitle: this.pageTitle,
      pageUrl: this.pageUrl,
      referrer: this.referrer,
      sessionKey: this.sessionKey,
      ip: this.ip,
      userKey: this.userKey,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(this.hostUrl + "/api/leads/feeds", requestOptions).catch((error) => console.log("error", error));
  };

  // add leads to table on tab change/close, page change
  App.TraekAnalytics.prototype.callTrackingApi = function () {
    try {
      const hostUrl = this.hostUrl + "/api/trackdata";
      if (this.allowLeads && this.callApi) {
        //check local event state
        const eventState = JSON.parse(localStorage.getItem("eventState")) || null;
        let isFormSubmitted = eventState.isFormSubmitted || false;

        const payload = {
          propertyId: this.propertyId,
          time: new Date() - this.visitedTime,
          pageTitle: this.pageTitle,
          pageUrl: this.pageUrl,
          referrer: this.referrer,
          sessionKey: this.sessionKey,
          ip: this.ip,
          userKey: this.userKey,
          userAgent: this.userAgent,
        };

        let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
        // track visitors local and submit those locally stored visitors once form submitted
        if (!isFormSubmitted && this.type === "isp") {
          const index = visitors.findIndex((visit) => {
            return (
              visit.propertyId === this.propertyId &&
              visit.sessionKey === this.sessionKey &&
              visit.pageUrl === this.pageUrl &&
              visit.userKey === this.userKey
            );
          });
          if (index >= 0) {
            visitors[index].time += new Date() - this.visitedTime;
          } else {
            visitors.push(payload);
          }
          localStorage.setItem("visitors", JSON.stringify(visitors));
        } else if (isFormSubmitted && this.type === "isp") {
          // if form submitted and type is ISP send this payload for visitor history
          navigator.sendBeacon(hostUrl, JSON.stringify({ visits: [payload], isBulkLeads: true }));
        } else {
          navigator.sendBeacon(hostUrl, JSON.stringify(payload));
        }
      }
    } catch (error) {
      console.info("add leads error =>", error);
    }
  };

  App.TraekAnalytics.prototype.trackForms = function () {
    if (this.allowForms && this.allowLeads) {
      let ignore = ["submit", "reset", "password", "file", "image", "radio", "checkbox", "button", "hidden"];
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
      ];
      try {
        let forms = document.querySelectorAll("form");
        function formSubmitted(e, form, data, cb) {
          const formName = e.currentTarget.name.value;
          const formId = e.currentTarget.id;
          let eventState = JSON.parse(localStorage.getItem("eventState")) || null;

          if (eventState) {
            eventState.isFormSubmitted = true;
          } else {
            eventState = {
              isFormSubmitted: true,
            };
          }

          localStorage.setItem("eventState", JSON.stringify(eventState));

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
            let label = element?.labels?.length > 0 ? element?.labels[0]?.innerText : name || "";
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
              elementObject.value = element.value;
              formData.elements.push(elementObject);
            } else if (tag === "SELECT") {
              for (const option of element.selectedOptions) {
                if (!elementObject.value) {
                  elementObject.value = [];
                }
                elementObject.value.push(option.value);
              }
              formData.elements.push(elementObject);
            } else if (tag === "INPUT") {
              switch (type) {
                case "radio":
                  if (element.checked) {
                    elementObject.value = element.value;
                    formData.elements.push(elementObject);
                  }
                  break;
                case "checkbox":
                  if (element.checked) {
                    let checkIndex = formData.elements.findIndex((element) => element.type === type && element.name === name);
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
          if (checkEmpty.every((data) => data === true)) {
            navigator.sendBeacon(data.hostUrl + "/api/track/forms", JSON.stringify(formData));
          }

          cb(true);
        }
        let localThis = this;
        forms.forEach((form) => {
          form.onsubmit = function (e) {
            formSubmitted(e, form, localThis, () => {
              uploadVisitorRecords(localThis.hostUrl);
              saveSessionRecording({ propertyId: localThis.propertyId, userKey: localThis.userKey, sessionKey: localThis.sessionKey, hostUrl: localThis.hostUrl });
            });
          };
        });
      } catch (error) {
        console.log(error);
      }
    }
  };

  App.TraekAnalytics.prototype.trackUserData = async function () {





    let previousUrl = "";
    const observer = new MutationObserver(function (mutations) {
      if (location.href !== previousUrl) {
        previousUrl = location.href;
      }
    });
    const config = { subtree: true, childList: true };
    observer.observe(document, config);

    const eventStateObj = JSON.parse(localStorage.getItem("eventState")) || null;

    if (!eventStateObj) {
      const eventState = {
        isFormSubmitted: false,
      };

      localStorage.setItem("eventState", JSON.stringify(eventState));
    }

    if (!this.userKey) {
      let userKey = await this.generateKey();
      localStorage.setItem("traek_user_key", userKey);
      this.userKey = userKey;
    }
    if (!this.sessionKey) {
      let sessionKey = await this.generateKey();
      sessionStorage.setItem("SESSION_KEY", sessionKey);
      this.sessionKey = sessionKey;

      const eventState = {
        isFormSubmitted: false,
      };

      // clear event state and session records on new session
      localStorage.setItem("eventState", JSON.stringify(eventState));
      // localStorage.setItem("sessionrecords", JSON.stringify([]));

      clearStore()

    }

    if (!this.ip) {
      let ip = await this.getUserIp();
      sessionStorage.setItem("ip", ip);
      this.ip = ip;
    }

    this.sessionRecord = localStorage.getItem("sessionrecords");

    this.isLoading = true;

    fetch(this.hostUrl + "/api/properties/property/" + this.apiKey, {
      method: "POST",
      body: JSON.stringify({
        api_key: this.apiKey,
        ip: this.ip,
        originUrl: this.pageUrl,
      }),
    })
      .then((data) => data.json())
      .then(({ realtime, property_id, verified, shouldAllowLead, chat_widget, forms, website_url, type, heatmaps }) => {
        this.propertyId = property_id;
        this.chatWidget = chat_widget;
        this.websiteUrl = website_url;
        this.allowForms = forms;
        this.type = type;
        this.heatmaps = heatmaps;

        if (this.heatmaps?.length > 0) {
          this.allowHeatmaps = true;
          this.captureHeatmaps();
        }

        // load rrweb script
        const traekRRWebScript = document.createElement("script");
        traekRRWebScript.src = "https://cdn.jsdelivr.net/npm/rrweb@latest/dist/record/rrweb-record.min.js";

        traekRRWebScript.onload = async () => {
          if (this.allowSessionRecord) {
            await this.recordSessions();
          }
        };
        document.head.appendChild(traekRRWebScript);

        const url = window.location != window.parent.location ? document.referrer : document.location.href;

        if (url !== "https://app.traek.io/") {
          this.getElementsData();
        }
        if (property_id && verified === true) {
          this.allowLeads = shouldAllowLead;
          this.callFeedsApi();
          this.trackForms();
          if (realtime) {
            App.TraekAnalytics.currentObject = this;
            let realtimeSctipt = document.createElement("script");
            realtimeSctipt.src = this.cdnUrl + "/realtime-uat.js";
            realtimeSctipt.type = "text/javascript";
            document.head.appendChild(realtimeSctipt);
          }
          if (this.propertyId && this.userKey && this.sessionKey && this.ip) {
            window.addEventListener("visibilitychange", () => {
              if (document.visibilityState === "visible") {
                this.visitedTime = new Date();
              } else {
                this.callTrackingApi();
              }
              if (document.visibilityState === "hidden") {
                saveSessionRecording({ propertyId: this.propertyId, userKey: this.userKey, sessionKey: this.userKey, hostUrl: this.hostUrl });
                this.allowSessionRecord = false;
              } else {
                this.allowSessionRecord = true;
              }
            });
            window.addEventListener("beforeunload", () => {
              this.saveHeatmap();
              this.callTrackingApi();
              this.callApi = false;
              saveSessionRecording({ propertyId: this.propertyId, userKey: this.userKey, sessionKey: this.sessionKey, hostUrl: this.hostUrl });
            });

            const observer = new MutationObserver(() => {
              let currentUrl = document.URL.replace(/\/$/, "");
              if (this.pageUrl !== currentUrl) {
                this.saveHeatmap();
                this.callTrackingApi();
                this.pageUrl = currentUrl;
                this.pageTitle = document.title;
                this.pageUrl = currentUrl;
                this.visitedTime = new Date();
                this.newVisit = true;
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
      })
      .catch((error) => {
        console.log(error.message);
      })
      .finally(() => {
        this.isLoading = false;
      });
  };

  App.TraekAnalytics.prototype.getElementsData = async function () {
    // return;
    try {
      const fetchedUrls = await fetch(`${this.cdnUrl}/themes/bars/${this.websiteUrl}/elementUrls.json`);
      const urlsObject = Object.values(JSON.parse(await fetchedUrls.text()));
      this.elementUrlData = urlsObject;

      App.TraekAnalytics.currentObject = this;
      let elementsScript = document.createElement("script");
      elementsScript.src = this.cdnUrl + "/elements-uat.js";
      elementsScript.type = "text/javascript";
      document.head.appendChild(elementsScript);
    } catch (error) {
      console.log("ERROR WHILE FETCHING ELEMENT URLS IN TRACKING-INIT-UAT", error);
    }
  };
})(Traek);
// const apiKey = document.querySelector("script[id*=traek_script]").id.split("&")[1];

// const traek = new Traek.TraekAnalytics(apiKey, "https://uat-app.traek.io", "https://assets.traek.io").trackUserData();

const apiKey = document.querySelector("script[id*=traek_script]").id.split("&")[1];
const isLive = !window.location.origin.includes("localhost");
console.info('isLive =>', isLive);

const hostUrl = isLive ? "https://uat-app.traek.io" : "http://localhost:4200"
const traek = new Traek.TraekAnalytics(apiKey, hostUrl, `${window.location.origin}/uat`).trackUserData();