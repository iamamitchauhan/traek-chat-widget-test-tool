import React from 'react'
import OwlCarousel from "react-owl-carousel";
import "owl.carousel/dist/assets/owl.carousel.css";
import "owl.carousel/dist/assets/owl.theme.default.css";

const Home = () => {
  return <div>
    <h2>Welcome to traek development testing tool</h2>
    <OwlCarousel
      className="owl-theme"
      loop
      autoplay margin={10}>
      <div class="item">
        <img alt={`avtar-model-100`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/ff_I-4.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-105`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/A-P6-8.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-110`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/ySqU-1.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-115`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/9UmX-11.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-120`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/ff_I-4.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-125`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/A-P6-8.jpg" />
      </div>
      <div class="item">
        <img alt={`avtar-model-130`} src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/ySqU-1.jpg" />
      </div>
      <div class="item">
        <img src="https://uploads.codesandbox.io/uploads/user/9480d5c0-6b58-40de-8854-caacb6c4a2f1/9UmX-11.jpg" />
      </div>
    </OwlCarousel>
  </div>
}

export default Home;