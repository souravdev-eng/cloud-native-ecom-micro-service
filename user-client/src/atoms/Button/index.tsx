import { FC } from 'react';

interface ButtonProps {
    title: string;
}

const Button: FC<ButtonProps> = ({ title }) => {
    return (
        <div className='bg-gray-950 text-white h-10 flex justify-center items-center cursor-pointer rounded-md'>
            <h5>{title}</h5>
        </div>
    );
};

export default Button;
