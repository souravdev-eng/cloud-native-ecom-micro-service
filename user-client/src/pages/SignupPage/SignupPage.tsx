import { Link } from 'react-router-dom';
import styles from './Signup.module.css';
import { useSignup } from './Signup.hook';

const SignupPage = () => {
  const { userFormData, handleInputChange, handleSignup } = useSignup();

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    // Add your login logic here
    // console.log('Login clicked with email:', email, 'and password:', password);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Create a new account</h2>
      <form className={styles.form}>
        <input
          type='text'
          name='name'
          placeholder='Name'
          value={userFormData.name}
          onChange={handleInputChange}
          className={styles.input}
        />
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
        <input
          type='password'
          name='passwordConform'
          placeholder='Confirm password'
          value={userFormData.passwordConform}
          onChange={handleInputChange}
          className={styles.input}
        />
        <button type='submit' className={styles.button} onClick={handleSignup}>
          Sign up
        </button>
      </form>
      <div className={styles.signupLink}>
        <p>
          Already have an account? <Link to='/auth/login'>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
