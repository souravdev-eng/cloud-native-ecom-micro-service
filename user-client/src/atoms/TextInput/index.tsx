import { FC } from 'react';
import styles from './TextInput.module.css';

interface TextInputProps {
    placeholder: string;
    type: string;
}

const TextInput: FC<TextInputProps> = ({ placeholder, type }) => {
    return (
        <div className={styles.container}>
            <label htmlFor={type} className={styles.label}>
                {type}
            </label>
            <input
                placeholder={placeholder}
                type={type}
                className={styles.input}
            />
        </div>
    );
};

export default TextInput;
