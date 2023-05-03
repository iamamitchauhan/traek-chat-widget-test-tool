/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarTogglerDemo01" aria-controls="navbarTogglerDemo01" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarTogglerDemo01">
        <a className="navbar-brand" href="#">Traek {"  "}<span className="badge badge-pill badge-primary">UAT</span></a>
        <ul className="navbar-nav mr-auto mt-2 mt-lg-0">
          <li className='btn btn-light mr-3'><NavLink to="/">Home</NavLink></li>
          <li className='btn btn-light mr-3'><NavLink to="/blog">Blog</NavLink></li>
          <li className='btn btn-light mr-3'><NavLink to="/about">About</NavLink></li>
          <li className='btn btn-light mr-3'><NavLink to="/contact-us">Contact</NavLink></li>
          <li className='btn btn-light mr-3'><NavLink to="/feedback">Feedback</NavLink></li>
        </ul>
        <form className="form-inline my-2 my-lg-0">
          <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
          <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
        </form>
      </div>
    </nav>

  );
}

export default Navigation;
