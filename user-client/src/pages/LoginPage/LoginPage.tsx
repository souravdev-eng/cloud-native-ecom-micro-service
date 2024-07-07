import { Link } from 'react-router-dom';

import { useLogin } from './Login.hook';
import styles from './Login.module.css';
import Button from '../../atoms/Button/Button';

const LoginPage = () => {
  const { handleLogin, userFormData, handleInputChange, loading } = useLogin();

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Login with your account</h2>
      <form className={styles.form}>
        <input
          type='email'
          name='email'
          placeholder='Email'
          value={userFormData.email}
          onChange={handleInputChange}
          className={styles.input}
        />
        <input
          type='password'
          name='password'
          placeholder='Password'
          value={userFormData.password}
          onChange={handleInputChange}
          className={styles.input}
        />
        <Button title='Login' onClick={handleLogin} loading={loading} />
      </form>
      <div className={styles.signupLink}>
        <p>
          Don't have an account? <Link to='/auth/signup'>Sign up</Link>
        </p>
        <p style={{ marginTop: 4, textAlign: 'center' }}>
          <Link to='/auth/forgotpassword'>Forgot password?</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
