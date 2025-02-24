import Button from '../../atoms/Button';
import TextInput from '../../atoms/TextInput';
import styles from './LoginScreen.module.css';

const LoginScreen = () => {
    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1 className='text-3xl text-gray-700 mb-2'>Welcome back</h1>
                <span className='text-sm text-gray-500'>
                    Welcome back! Please enter your details
                </span>
                <div className='flex flex-col flex-1 gap-5 mt-5 w-3/4 align-middle'>
                    <TextInput type='Email' placeholder='Enter your email' />
                    <TextInput
                        type='password'
                        placeholder='Enter your password'
                    />
                    <div className='flex flex-row justify-between'>
                        <div style={{ display: 'flex', alignItems: 'centers' }}>
                            <input
                                type='checkbox'
                                className='cursor-pointer mr-2'
                            />
                            <span className='text-sm text-center'>
                                Remember for 30 days
                            </span>
                        </div>
                        <div>
                            <span className='text-sm text-blue-700 cursor-pointer'>
                                Forgot password?
                            </span>
                        </div>
                    </div>
                    <Button title='Sign in' />
                    <div className='flex flex-col items-center'>
                        <span className='text-sm text-gray-900'>
                            Don't have an account?{' '}
                            <span className='text-sm text-blue-700 cursor-pointer'>
                                Signup
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div className={styles.imageContainer}>
                <h1>LoginScreen</h1>
            </div>
        </div>
    );
};

export default LoginScreen;
