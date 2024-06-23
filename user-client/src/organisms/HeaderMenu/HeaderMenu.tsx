import { Link } from 'react-router-dom';
import styles from './HeaderMenu.module.css';
import { useAppSelector } from '../../hooks/useRedux';
import { useHeaderMenu } from './HeaderMenu.hook';

const HeaderMenu = () => {
  const { handleLoggedOut } = useHeaderMenu();
  const { user } = useAppSelector((state) => state.users);

  return (
    <div className={styles.container}>
      <div>
        <span className={styles.tagText}>FREE RETURNS. STANDARD SHIPPING ORDERS $99+</span>
      </div>
      <div>
        <Link to='#' className={styles.link}>
          <span>My Account</span>
        </Link>
        <Link to='#' className={styles.link}>
          <span>About us</span>
        </Link>
        <Link to='#' className={styles.link}>
          <span>Blog</span>
        </Link>
        <Link to='#' className={styles.link}>
          <span>My Whishlist</span>
        </Link>
        <Link to='#' className={styles.link}>
          <span>Cart</span>
        </Link>
        {user?.email ? (
          <a className={styles.link} onClick={handleLoggedOut} style={{ cursor: 'pointer' }}>
            <span>Log out</span>
          </a>
        ) : (
          <Link to='/auth/login' className={styles.link}>
            <span>Log in</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default HeaderMenu;
