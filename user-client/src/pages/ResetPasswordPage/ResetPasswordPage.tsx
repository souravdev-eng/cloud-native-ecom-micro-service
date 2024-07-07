import { useResetPassword } from './ResetPassword.hook';
import Button from '../../atoms/Button/Button';
import styles from './ResetPassword.module.css';

const ResetPasswordPage = () => {
  const { email, newPassword, handleResetPassword, handleInputChange, loading } =
    useResetPassword();

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Reset your password</h2>
      <form className={styles.form}>
        <input
          type='email'
          name='email'
          placeholder='Email'
          value={email!}
          onChange={handleInputChange}
          className={styles.input}
          style={{ backgroundColor: '#e9ecef' }}
          disabled
        />
        <input
          type='password'
          name='newpassword'
          placeholder='Enter your new password'
          value={newPassword}
          onChange={handleInputChange}
          className={styles.input}
        />

        <Button title='Reset Password' onClick={handleResetPassword} loading={loading} />
      </form>
    </div>
  );
};

export default ResetPasswordPage;
