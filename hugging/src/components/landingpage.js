import React, { useEffect } from 'react';
import { Link,Navigate } from 'react-router-dom';
import './landingpage.css';

const LandingPage = () => {
  useEffect(() => {
    // Add the class to the body when the component mounts
    document.body.classList.add('landing-page');

    // Clean up the class when the component unmounts
    return () => {
      document.body.classList.remove('landing-page');
    };
  }, []);
  
  // *** Checking if there is token already in the browser :
  // const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  // // If authToken exists, redirect to '/userpage'
  // if (authToken) {
  //   return <Navigate to="/userpage" />;
  // }


  return (
    <div className="LandingPageContainer">
      <h1 className="AnimatedText">Welcome to Our Hugging Face Like Platform</h1>
      <div className="ButtonContainer">
        <Link to="/login"><button className="Button">Login</button></Link>
        <Link to="/signup"><button className="Button">Signup</button></Link>
      </div>
    </div>
  );
};

export default LandingPage;