import './index.css';

const App = () => (
  <div className='bg-gray-100 h-screen w-screen flex items-center justify-center'>
    <div className='flex flex-col gap-4 bg-white p-4 rounded-md shadow-md w-1/4'>
      <h1 className='text-3xl font-bold text-blue-500'>Create Account</h1>
      <form className='flex flex-col gap-4'>
        <input
          type='text'
          placeholder='First Name'
          className='border border-gray-300 rounded-md p-2'
        />
        <input
          type='text'
          placeholder='Last Name'
          className='border border-gray-300 rounded-md p-2'
        />
        <input type='text' placeholder='Email' className='border border-gray-300 rounded-md p-2' />
        <input
          type='password'
          placeholder='Password'
          className='border border-gray-300 rounded-md p-2'
        />
        <input
          type='password'
          placeholder='Confirm Password'
          className='border border-gray-300 rounded-md p-2'
        />

        <button type='submit' className='bg-blue-500 text-white rounded-md p-2 cursor-pointer'>
          Sign Up
        </button>
      </form>
    </div>
  </div>
);

export default App;
