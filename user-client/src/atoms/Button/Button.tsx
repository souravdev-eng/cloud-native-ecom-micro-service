import { FC } from 'react';
import styles from './button.module.css';

interface ButtonProps {
  type?: 'submit' | 'button' | 'reset' | undefined;
  title: string;
  loading: boolean;
  onClick: any;
}

const Button: FC<ButtonProps> = ({ onClick, title, loading, type }) => {
  return (
    <button type={type} className={styles.button} onClick={onClick}>
      {loading ? <div className={styles.loaderWrapper} /> : <>{title}</>}
    </button>
  );
};

export default Button;
