import React, { Component } from "react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import NotFound from "./components/NotFound";

import Blog from "./pages/Blog";
import Home from "./pages/Home";
import About from "./pages/About";
import ContactUs from "./pages/ContactUs";
import Feedback from "./pages/Feedback";
import Navigation from "./components/Navigation";
import Layout from "./components/Layout";


class App extends Component {
  // Prevent page reload, clear input, set URL and push history on submit
  handleSubmit = (e, history, searchInput) => {
    e.preventDefault();
    e.currentTarget.reset();
    let url = `/search/${searchInput}`;
    history.push(url);
  };

  render() {
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
    );
  }
}

export default App;
