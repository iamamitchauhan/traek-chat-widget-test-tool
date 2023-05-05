import React, { useEffect } from 'react'

const Feedback = () => {
  useEffect(() => {
    document.title = "Feedback"
  }, [])

  return (
    <div>
      <h1 className='text-center'>Feedback</h1>
      <div className='align-items-center d-flex justify-content-center'>
        <form className="needs-validation" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <div className="col-md-6">
              <label htmlFor="validationCustom01">First name</label>
              <input type="text" className="form-control" id="validationCustom01" placeholder="First name" />
            </div>
            <div className="col-md-6">
              <label htmlFor="validationCustom02">Last name</label>
              <input type="text" className="form-control" id="validationCustom02" placeholder="Last name" />
            </div>
          </div>
          <div className="form-row">
            <div className="col-md-12 mb-3">
              <label htmlFor="validationCustom03">Email</label>
              <input type="email" className="form-control" id="validationCustom03" placeholder="Email Address" />
            </div>
          </div>
          <div className="form-group">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="invalidCheck" />
              <label className="form-check-label" htmlFor="invalidCheck">
                Agree to terms and conditions
              </label>

            </div>
          </div>
          <div className="form-row align-content-center form-row justify-content-center">
            <button className="btn btn-primary" type="submit">Submit form</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Feedback