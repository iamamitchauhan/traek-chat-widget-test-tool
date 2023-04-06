import React from "react";
import Form from "./Form";
import Navigation from "./Navigation";

const Header = ({ history, handleSubmit }) => {



  const postRRWebData = async () => {
    try {
      // navigator.sendBeacon(url, JSON.stringify(payload));

      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          data: [{ name: "" }],
          "propertyId": "6050b4224c0faddf4acbd797",
          "userKey": "ZAI1nZGCuyIwHVe4ibd663rjg41evzKa",
          "sessionKey": "pcN2g9j0GPDoSEUsOwqyRJHmgnMn7wiI",
          "ip": "150.107.232.194",
          "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
          "pageUrl": "https://www.thirdrocktechkno.com/hire-us",
          "page": "Hire Web App Developers | Hire Mobile Developers India",
          "isFormSession": true
        })
      };

      const response = await fetch("http://localhost:4200/api/session-recording", requestOptions);
      const data = await response.json();

      if (data) {
        console.info("record saved =>");
      }
    } catch (error) {
      console.info("ERROR WHILE saving API CALL", error);
    }
  }
  return (
    <div>
      <h1>Traek Development Tool</h1>
      <button onClick={() => {
        postRRWebData()
      }}>Save RRWEB DATA</button>
      <Form history={history} handleSubmit={handleSubmit} />
      <Navigation />
    </div>
  );
};

export default Header;
