import React from 'react';

interface InputFieldProps {
  label: string;
  type: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  value: string;
}

const TextInput: React.FC<InputFieldProps> = ({
  label,
  type,
  name,
  placeholder,
  required,
  value,
}) => {
  return (
    <div>
      <label htmlFor={name} className='block text-sm font-medium leading-6 text-gray-900'>
        {label}
      </label>
      <div className='mt-2'>
        <input
          placeholder={placeholder}
          id={name}
          name={name}
          type={type}
          required={required}
          value={value}
          className='block w-full rounded-md border-0 px-2 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
          readOnly // Make input read-only in the server component
        />
      </div>
    </div>
  );
};

export default TextInput;
