import React, { useEffect } from 'react'

const ContactUs = () => {
  useEffect(() => {
    document.title = "ContactUs"
  }, [])

  return (
    <div>Contact Us</div>
  )
}

export default ContactUs