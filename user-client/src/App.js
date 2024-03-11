import Header from './components/Header/Header';
import './App.css';
import Signup from './page/Signup/Signup';
import { useEffect } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BASE_URL } from './api/baseUrl';

function App() {
  // const [currentUser, setCurrentUser] = useState(null);

  const getCurrentUser = async () => {
    const { data } = await axios.get(`${BASE_URL}/users/currentuser`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log({ data });
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return (
    <>
      <Header />
      <Signup />
    </>
  );
}

export default App;
