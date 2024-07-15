import React from 'react';
import Link from 'next/link';
import TextInput from '@/components/ui/TextInput';

const SignUpPage = () => {
  return (
    <>
      <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
        <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
          <img
            alt='Ecom'
            src='https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600'
            className='mx-auto h-10 w-auto'
          />
          <h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
            Sign up to your account
          </h2>
        </div>

        <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
          <form action='#' method='POST' className='space-y-6'>
            <TextInput
              label='Name'
              type='text'
              name='name'
              placeholder='Enter your name'
              required={true}
              value=''
            />
            <TextInput
              label='Email address'
              type='email'
              name='email'
              placeholder='Enter your email'
              required={true}
              value=''
            />
            <TextInput
              label='Password'
              type='password'
              name='password'
              placeholder='Enter your password'
              required={true}
              value=''
            />
            <TextInput
              label='Confirm Password'
              type='password'
              name='confirmPassword'
              placeholder='Confirm your password'
              required={true}
              value=''
            />

            <div>
              <button
                type='submit'
                className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>
                Sign up
              </button>
            </div>
          </form>

          <p className='mt-10 text-center text-sm text-gray-500'>
            Already have a account?{' '}
            <Link
              href='/sign-in'
              className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
