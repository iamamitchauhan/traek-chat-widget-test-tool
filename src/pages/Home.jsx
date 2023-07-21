import React, { useEffect } from 'react'

const Home = () => {
  useEffect(() => {
    document.title = "Home"
  }, [])

  return (
    <div>
      <h1 className="" id="content">The only sales and marketing tool you need to grow your business</h1>
      <p>An all-in-one sales and marketing solution</p>
      <p>to drive optimum traffic and get qualified leads</p>
      <h2>Recognize Your Anonymous Website Visitors</h2>
      <ul>
        <li>Get to know everything about the organizations which visited your website - their social media handles, details about their page visits and most importantly the technologies which they are currently using on their own site.</li>
        <li>Connect with the organizations that show high purchasing intent.</li>
        <li>Create your own filters and define what a quality lead is for your business.</li>
        <li>Watch your priority leads and make sure that you do not miss them when they visit your site.</li>
        <li>Bots and spam visitors are automatically scrubbed so that you pay only for quality leads.</li>
      </ul>
    </div>
  )
}

export default Home