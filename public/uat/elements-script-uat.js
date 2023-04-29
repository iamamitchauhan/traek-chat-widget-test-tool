var barHeight, barPlacement, displayDelay, animateEntryExit, hideBar, pushPage, staticScroll, animateButton, goal, type, elementId, fbUrl, targetUrl;

async function sendingDataToParent() {
  barHeight = await document.querySelector(".bar-height").textContent;
  barPlacement = await document.querySelector(".placement").textContent;
  displayDelay = await document.querySelector(".display-delay").textContent;
  animateEntryExit = await document.querySelector(".animate-entry-exit").textContent;
  hideBar = await document.querySelector(".hide-bar").textContent;
  pushPage = await document.querySelector(".push-page").textContent;
  staticScroll = await document.querySelector(".static-scroll").textContent;
  animateButton = await document.querySelector(".animate-button").textContent;
  goal = await document.querySelector(".goal").textContent;
  type = await document.querySelector(".type").textContent;
  elementId = await document.querySelector(".element-id").textContent;
  phoneNumber = await document.querySelector(".phone-number").textContent;
  fbUrl = await document.querySelector(".fb-url").textContent;
  targetUrl = await document.querySelector(".target-url").textContent;

  let msg = {};
  msg.barMetadata = {
    barHeight: barHeight,
    barPlacement: barPlacement,
    displayDelay: displayDelay,
    animateEntryExit: animateEntryExit,
    hideBar: hideBar,
    pushPage: pushPage,
    staticScroll: staticScroll,
    animateButton: animateButton,
    goal: goal,
    type: type,
    elementId: elementId,
    fbUrl: fbUrl,
    targetUrl: targetUrl,
  };
  parent.postMessage({ target: "traekElements", action: "loadElement", data: msg }, "*");
}

window.addEventListener("load", function () {
  sendingDataToParent();
});

window.addEventListener("message", ({ data }) => {
  if (data.target === "TraekElementsScript" && data.action === "ElementsData") {
    const iframeCss = data.metadata.elementIframeCss;
    const hostUrl = data.metadata.hostUrl;
    const propertyId = data.metadata.propertyId;
    let emailId = null;

    let elementIframeCss = document.createElement("style");
    elementIframeCss.innerHTML = iframeCss;
    document.head.append(elementIframeCss);

    const closeBtn = document.querySelector(".notification-bar-close-icon");
    if (closeBtn) {
      closeBtn.onclick = toogleHideBar;
    }

    switch (goal) {
      case "collect-emails":
        handleEmailCollectionBar();
        break;
      case "get-phone-calls":
        handlePhoneCallsBar();
        break;
      case "social-traffic":
        handleSocialTrafficBar();
        break;
      case "target-url":
        handleTargetUrlBar();
        break;
      default:
        console.log("No goal found");
        break;
    }

    function handleEmailCollectionBar() {
      const emailInput = document.querySelector(".collect-emails-bar-input");

      const subscribeBtn = document.querySelector(".collect-emails-btn-action");
      subscribeBtn.onclick = () => storeEmailsToDb(emailInput, subscribeBtn);
    }

    function validateEmail(email) {
      return String(email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    }

    async function storeEmailsToDb(emailInput, subscribeBtn) {
      emailId = emailInput.value;

      if (!emailId || !validateEmail(emailId)) {
        emailInput.classList.add("animate__animated", "animate__shakeX");
        emailInput.style.border = "2px solid red";
        setTimeout(() => {
          emailInput.classList.remove("animate__animated", "animate__shakeX");
        }, 800);
        return;
      }

      const checkHasUserSubscribed = await fetch(
        `${hostUrl}/api/responses/check?property_id=${propertyId}&email_id=${emailId}&element_id=${elementId}`,
        {
          method: "GET",
          headers: {
            authkeyhash: "Tr@3k.i0l@m8d@",
            "Content-Type": "application/json",
          },
        }
      );

      const response = await checkHasUserSubscribed.json();

      if (response.msg === "Found") {
        document.querySelector(".collect-emails-bar-text").textContent = "You have already subscribed!";
        document.querySelector(".collect-emails-btn-link").style.display = "none";
        emailInput.style.display = "none";
        subscribeBtn.style.display = "none";
      } else {
        fetch(`${hostUrl}/api/responses`, {
          method: "POST",
          headers: {
            authkeyhash: "Tr@3k.i0l@m8d@",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            property_id: propertyId,
            element_id: elementId,
            email_id: emailId,
          }),
        })
          .then((res) => {
            if (res.status === 201) {
              emailInput.value = "";
              document.querySelector(".collect-emails-bar-text").textContent = "Thank you for subscribing!";
              document.querySelector(".collect-emails-btn-link").style.display = "none";
              emailInput.style.display = "none";
              subscribeBtn.style.display = "none";
            }
          })
          .catch((err) => {
            console.log("====> ERROR OCCURED WHILE STORING RESPONSES <====", err);
          });
      }
    }

    function handlePhoneCallsBar() {
      const getCallBtn = document.querySelector(".collect-number-btn-link");
      getCallBtn.setAttribute("href", `tel:${phoneNumber}`);
      getCallBtn.setAttribute("target", "_blank");
    }

    function handleSocialTrafficBar() {
      const socialMediaBtn = document.querySelector(".social-traffic-btn-link");

      socialMediaBtn.setAttribute("href", fbUrl);
      socialMediaBtn.setAttribute("target", "_blank");
    }

    function handleTargetUrlBar() {
      const redirectUrlBtn = document.querySelector(".target-url-btn-link");
      redirectUrlBtn.setAttribute("href", targetUrl);
      redirectUrlBtn.setAttribute("target", "_blank");
    }

    function toogleHideBar() {
      parent.postMessage(
        {
          target: "traekElements",
          action: "RemoveIframe",
          elementId,
        },
        "*"
      );
    }
  }
});
