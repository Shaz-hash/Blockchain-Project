import { Link } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import './userpage.css';
import { UsernameContext } from '../userdata/usernamecontext';

const UserPage = () => {
  const { username } = useContext(UsernameContext);
  console.log("username", username);

  useEffect(() => {
    // Add the class to the body when the component mounts
    document.body.classList.add('user-page');

    // Clean up the class when the component unmounts
    return () => {
      document.body.classList.remove('user-page');
    };
  }, []);

  return (
    <div className='UserPageContainer'>
      <h1>Welcome {username} to Hugging Face!</h1>
      <Link to="/filelist"><button className="Button">Fetch Datasets</button></Link>
      <Link to="/fileupload"><button className="Button">Upload Datasets</button></Link>
      <Link to="/workflow"><button className="Button">Workflow Page</button></Link>
      <Link to="/dataset"><button className="Button">DataSet Page</button></Link>
    </div>
  );
}

export default UserPage;