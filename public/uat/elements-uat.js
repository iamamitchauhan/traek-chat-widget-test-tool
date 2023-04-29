let IframeCss = `
.traekElementIframeCss body {
  width: 100%;
  height: 60px; 
  padding: 0;
  margin: 0;
  border: 0;
}

.traekElementIframeCss {
  z-index:99999999;
  margin: 0;
  padding: 0;
}

.traek-element-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width:100%;
}

.traek-element-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width:100%;
}

body{
  margin: 0;
  padding: 0;
}

.display-none {
  display: none;
}

.display-block {
  display: block;
}
`;

(function (App) {
  App.elementsCommunicationLayer = function (TraekObject) {
    this.hostUrl = TraekObject.hostUrl;
    this.cdnUrl = TraekObject.cdnUrl;
    this.propertyId = TraekObject.propertyId;
    this.elementUrlData = TraekObject.elementUrlData || [];
    this.websiteUrl = TraekObject.websiteUrl;
  };

  App.elementsCommunicationLayer.prototype.handleElements = function () {
    this.elementUrlData.forEach((element) => {
      this.elementPlacementHandler(element);
    });

    window.addEventListener("message", ({ data }) => {
      if (data.target === "traekElements" && data.action === "loadElement") {
        this.findAndStyleIframe(data.data);
      }

      if (data.target === "traekElements" && data.action === "RemoveIframe") {
        let elementIframe = document.querySelector(
          `iframe[id='${data.elementId}']`
        );
        elementIframe.style.display = "none";
        document.body.style.paddingTop = "0px";
      }
    });
  };

  App.elementsCommunicationLayer.prototype.elementPlacementHandler = function (
    element
  ) {
    let barId = element.split("/")[3];
    let elementIframe = document.createElement("iframe");
    elementIframe.id = barId;
    elementIframe.style.display = "none";
    elementIframe.src = `${this.cdnUrl}/${element}`;

    document.body.appendChild(elementIframe);
  };

  App.elementsCommunicationLayer.prototype.findAndStyleIframe = function (
    data
  ) {
    let elementId = data.barMetadata.elementId;
    let elementIframe = document.getElementById(elementId);

    elementIframe.contentWindow.postMessage(
      {
        iframeId: elementId,
        target: "TraekElementsScript",
        action: "ElementsData",
        metadata: {
          hostUrl: this.hostUrl,
          elementIframeCss: IframeCss,
          propertyId: this.propertyId,
        },
      },
      "*"
    );

    setTimeout(() => {
      elementIframe.style.display = "block";
      if (data.barMetadata.pushPage === "true") {
        document.body.style.paddingTop = `${data.barMetadata.barHeight}px`;
      }
      if (data.barMetadata.staticScroll === "true") {
        elementIframe.style.position = "fixed";
      }
      elementIframe.style.border = "none";
      elementIframe.style.height = `${data.barMetadata.barHeight || 60}px`;
      elementIframe.scrolling = "no";
    }, `${data.barMetadata.displayDelay}000`);

    let elementIframeCss = document.createElement("style");
    elementIframeCss.innerHTML = IframeCss;
    document.head.append(elementIframeCss);

    elementIframe.classList.add("traekElementIframeCss");

    switch (data.barMetadata.barPlacement) {
      case "Top":
        elementIframe.classList.add("traek-element-top");
        return;
      case "Bottom":
        elementIframe.classList.add("traek-element-bottom");
        return;
      default:
        elementIframe.classList.add("traek-element-top");
        break;
    }
  };
})(Traek);

new Traek.elementsCommunicationLayer(
  Traek.TraekAnalytics.currentObject
).handleElements();
