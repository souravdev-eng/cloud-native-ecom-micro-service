import { Link } from 'react-router-dom';

import { useForgotPassword } from './ForgotPassword.hook';
import Button from '../../atoms/Button/Button';
import styles from './ForgotPassword.module.css';

const ForgotPasswordPage = () => {
  const { email, handleForgotPassword, handleInputChange, loading } = useForgotPassword();

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Reset your password</h2>
      <form className={styles.form}>
        <input
          type='email'
          name='email'
          placeholder='Email'
          value={email}
          onChange={handleInputChange}
          className={styles.input}
        />

        <Button title='Submit' onClick={handleForgotPassword} loading={loading} />
      </form>
      <div className={styles.signupLink}>
        <p>
          Go back to Signin? <Link to='/auth/signin'>Signin</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
