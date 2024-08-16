import { FC, CSSProperties } from 'react';
import styles from './button.module.css';

interface ButtonProps {
    type?: 'submit' | 'button' | 'reset' | undefined;
    title: string;
    loading: boolean;
    onClick: any;
    style?: CSSProperties;
}

const Button: FC<ButtonProps> = ({ onClick, title, loading, type, style }) => {
    return (
        <button
            type={type}
            className={styles.button}
            onClick={onClick}
            style={style}>
            {loading ? <div className={styles.loaderWrapper} /> : <>{title}</>}
        </button>
    );
};

export default Button;
