import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="main-nav">
      <button onClick={() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }}>Clear Site Data</button>
      <ul>
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/mountain">Mountain</NavLink></li>
        <li><NavLink to="/animal">Animal</NavLink></li>
        <li><NavLink to="/bird">Birds</NavLink></li>
        <li><NavLink to="/computer">Computer</NavLink></li>
        <li><NavLink to="/feedback">Feedback</NavLink></li>
        <li><NavLink to="/rrweb">RR Web</NavLink></li>
      </ul>
    </nav>
  );
}

export default Navigation;
