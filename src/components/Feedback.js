import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom';

const FeedBack = () => {

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("hello world")
  }

  useEffect(() => {
    document.title = `Feedback | TRT`
    // window.location.reload();
  }, [])


  return <div>
    <NavLink to="/mountain"><span>Back</span></NavLink>
    <h1>FeedBack</h1>
    <div>
      <form onSubmit={onSubmit}>
        <div>
          <span>Name</span>
          <input type='text' name="name" />
        </div>
        <div>
          <span>Surname</span>
          <input type='text' name="surname" />
        </div>
        <div>
          <span>Email</span>
          <input name="email" />
        </div>
        <div>
          <button type='submit'>Submit</button>
        </div>
      </form>
    </div>
  </div>
}

export default FeedBack;