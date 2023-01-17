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
    this.width = window.innerWidth;
    this.height = document.documentElement.scrollHeight;
    this.heatmapData = [];
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
  };

  App.TraekAnalytics.prototype.captureHeatmaps = function () {
    setInterval(() => {
      this.saveHeatmap();
    }, 10 * 1000);
    document.addEventListener(
      "click",
      (ev) => {
        this.heatmapData.push({
          x: ev.pageX,
          y: ev.pageY,
          height: this.height,
          width: this.width,
        });
      },
      true
    );
    let trackData = false;
    setInterval(function () {
      trackData = true;
    }, 50);

    let idleTimeout, idleInterval;
    let lastX, lastY;
    let idleCount;
    const startIdle = () => {
      idleCount = 0;
      const idle = () => {
        this.heatmapData.push({
          x: lastX,
          y: lastY,
          height: this.height,
          width: this.width,
        });
        idleCount++;
        if (idleCount > 10) {
          clearInterval(idleInterval);
        }
      };
      idle();
      idleInterval = setInterval(idle, 1000);
    };
    document.onmousemove = (ev) => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      if (idleInterval) {
        clearInterval(idleInterval);
      }
      if (trackData) {
        this.heatmapData.push({
          x: ev.pageX,
          y: ev.pageY,
          height: this.height,
          width: this.width,
        });
        trackData = false;
      }

      idleTimeout = setTimeout(startIdle, 500);
    };
    document.onmouseout = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }

      if (idleInterval) {
        clearInterval(idleInterval);
      }
    };
  };

  App.TraekAnalytics.prototype.saveHeatmap = function () {
    if (this.heatmapData.length > 0 && this.allowHeatmaps) {
      this.heatmaps
        .filter(({ url }) => url === this.pageUrl)
        .forEach(({ _id }) => {
          const body = {
            propertyId: this.propertyId,
            heatmapId: _id,
            heatmapData: this.heatmapData,
            userKey: this.userKey,
            newVisit: this.newVisit,
          };
          let url = this.hostUrl + "/api/heatmaps/save";
          fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
        });
      this.newVisit = false;
    }
    this.heatmapData = [];
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

  // add leads to table on tab change/close, page change
  App.TraekAnalytics.prototype.callTrackingApi = function ({ initialCall }) {
    try {
      //check local event state
      const eventState = JSON.parse(localStorage.getItem("eventState")) || null;
      let isFormSubmitted = eventState.isFormSubmitted || false;

      const payload = {
        initialCall: false,
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

      console.info("callTrackingApi state =>", { isFormSubmitted, "this.type": this.type, "this.callApi": this.callApi });

      if (!isFormSubmitted && this.type === "isp" && this.callApi) {
        const index = visitors.findIndex((visit) => {
          return (
            visit.propertyId === this.propertyId &&
            visit.sessionKey === this.sessionKey &&
            visit.pageUrl === this.pageUrl &&
            visit.userKey === this.userKey
          );
        });

        console.info("callTrackingApi visitor index =>", index);

        if (index >= 0) {
          visitors[index].time += new Date() - this.visitedTime;
        } else {
          if (visitors.length <= 0) {
            payload.initialCall = true;
          }
          visitors.push(payload);
        }

        localStorage.setItem("visitors", JSON.stringify(visitors));
      } else if (this.allowLeads && this.callApi) {
        if (isFormSubmitted && this.type === "isp") {
          console.info('ISP lead tracked');

          // if form submitted and type is ISP send this payload for visitor history
          const hostUrl = this.hostUrl + "/api/trackdata";
          navigator.sendBeacon(hostUrl, JSON.stringify({ visits: [payload], isBulkLeads: true }));
        } else {
          console.info('None ISP lead tracked');
          navigator.sendBeacon(
            this.hostUrl + "/api/trackdata",
            JSON.stringify({
              initialCall,
              propertyId: this.propertyId,
              time: new Date() - this.visitedTime,
              pageTitle: this.pageTitle,
              pageUrl: this.pageUrl,
              referrer: this.referrer,
              sessionKey: this.sessionKey,
              ip: this.ip,
              userKey: this.userKey,
              userAgent: this.userAgent,
            })
          );
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
        function formSubmitted(e, form, data) {
          const formName = `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`;
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

          uploadVisitorRecords(data.hostUrl);
        }
        let localThis = this;
        forms.forEach((form) => {
          form.onsubmit = function (e) {
            formSubmitted(e, form, localThis);
          };
        });
      } catch (error) {
        console.log(error);
      }
    }
  };

  App.TraekAnalytics.prototype.trackUserData = async function () {
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
    }
    if (!this.ip) {
      let ip = await this.getUserIp();
      sessionStorage.setItem("ip", ip);
      this.ip = ip;
    }
    if (this.apiKey && this.userKey && this.sessionKey && this.ip) {
      window.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.visitedTime = new Date();
        } else {
          this.callTrackingApi({ initialCall: false });
        }
      });
      window.addEventListener("beforeunload", () => {
        this.callTrackingApi({ initialCall: false });
        this.callApi = false;
      });
    }
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
      .then(({ realtime, property_id, verified, status, leadsCount, allowLeadsNumber, chat_widget, forms, website_url, type, heatmaps }) => {
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

        const url = window.location != window.parent.location ? document.referrer : document.location.href;

        if (url !== "https://app.traek.io/") {
          this.getElementsData();
        }
        if (property_id && verified === true) {
          status === "canceled" || (status === "lite" && leadsCount >= allowLeadsNumber) ? (this.allowLeads = false) : (this.allowLeads = true);
          this.callTrackingApi({ initialCall: true });
          this.trackForms();
          (function (history, obj) {
            var pushState = history.pushState;
            history.pushState = function (state) {
              obj.allowHeatmaps = false;
              obj.callTrackingApi({ initialCall: false });
              obj.pageTitle = document.title;
              obj.pageUrl = document.URL;
              obj.visitedTime = new Date();
              setTimeout(function () {
                obj.trackForms();
              }, 2000);
              return pushState.apply(history, arguments);
            };
          })(window.history, this);
          if (realtime) {
            App.TraekAnalytics.currentObject = this;
            let realtimeSctipt = document.createElement("script");
            realtimeSctipt.src = this.cdnUrl + "/realtime-uat.js";
            realtimeSctipt.type = "text/javascript";
            document.head.appendChild(realtimeSctipt);
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
const apiKey = document.querySelector("script[id*=traek_script]").id.split("&")[1];
const traek = new Traek.TraekAnalytics(apiKey, "http://localhost:4200", "http://localhost:3000/uat").trackUserData();