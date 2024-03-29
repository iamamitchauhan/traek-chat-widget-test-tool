import React from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import NotFound from "./components/NotFound";

import Blog from "./pages/Blog";
import Home from "./pages/Home";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";
import Feedback from "./pages/Feedback";
import Navigation from "./components/Navigation";
import Layout from "./components/Layout";

const App = () => {
  return (
    <Router basename="/SnapScout">
      <Navigation />
      <Layout>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/blog" component={Blog} />
          <Route exact path="/about" component={About} />
          <Route exact path="/contact-us" component={ContactUs} />
          <Route exact path="/feedback" component={Feedback} />
          <Route path="*" component={NotFound} />
        </Switch>
      </Layout>
    </Router>
  )
}

export default App