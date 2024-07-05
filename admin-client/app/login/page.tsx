import styles from './Login.module.css';

export default function LoginScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <div style={{ marginBottom: 25 }}>
          <h1 className={styles.title}>Welcome back</h1>
          <span>Enter your email and password to login</span>
        </div>
        <div className={styles.inputGroup}>
          <input type='email' placeholder='Enter your email' />
          <input type='password' placeholder='Enter your password' />
          <button>Login</button>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          backgroundColor: '#dbe4ff',
          height: '500px',
          width: '500px',
          alignSelf: 'center',
        }}></div>
    </div>
  );
}
