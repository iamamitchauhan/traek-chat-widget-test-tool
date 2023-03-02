import Axios from 'axios';
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import rrwebPlayer from 'rrweb-player';

import 'rrweb-player/dist/style.css';

const RRWeb = ({ propertyId = "6322d3511729b3f58502ac28" }) => {


  const userKey = localStorage.getItem("traek_user_key") ?? ""
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSessionData = async () => {
    try {
      setIsLoading(true)
      const { data: { data = [] } } = await Axios.get("https://uat-app.traek.io/api/session-recording", { params: { propertyId, userKey } })
      setEvents(data)

    } catch (error) {
      console.info('fetch session-recording error =>', error);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);


  useEffect(() => {
    if (events.length) {
      try {

        new rrwebPlayer({
          width: 512,
          autoPlay: false,
          target: document.getElementById("replay_video"), // customizable root element
          props: {
            events: events,
            UNSAFE_replayCanvas: true,
            skipInactive: false,
          },
        })
      } catch (error) {
        console.info('rrwebPlayer error =>', error);
      }
    }
  }, [events])


  return (
    <div>
      <NavLink to="/" style={{ color: "black", background: "#fff" }}><span>Back</span></NavLink>
      {isLoading ? <div>Loading</div> :
        events.length <= 0 &&
        <div>No record found</div>
      }
      <div id="replay_video"></div>
    </div>
  );
};

export default RRWeb;