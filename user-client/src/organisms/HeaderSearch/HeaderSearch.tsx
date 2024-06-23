import { Badge } from '@mui/material';
import { SearchOutlined, KeyboardArrowDownOutlined, LocalMallOutlined, PersonOutlineOutlined, FavoriteBorderOutlined } from '@mui/icons-material';
import styles from './HeaderSearch.module.css';

const HeaderSearch = () => {
  return (
    <div className={styles.container}>
      <div>
        <span className={styles.logo}>ECom</span>
      </div>
      <div className={styles.searchBar}>
        <input placeholder='Search...' className={styles.textInput} />
        <div style={{ borderLeft: '1px solid #fff', height: '40px' }} />
        <div style={{ width: 100, backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span className={styles.categoriesText}>
            All Categories
          </span>
          <KeyboardArrowDownOutlined
            style={{ height: 15, width: 15, cursor: 'pointer', backgroundColor: 'transparent' }} />
        </div>
        <div style={{ borderLeft: '1px solid #fff', height: '40px' }} />
        <div style={{ backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><SearchOutlined style={{ height: 20, width: 20, backgroundColor: 'transparent', color: '#343a40' }} /></div>
      </div>
      <div className={styles.iconGroupConatiner}>
        <div>
          <div style={{ fontSize: 12 }}>Call Us Now</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>+123 5679 890</div>
        </div>
        <div className={styles.iconGroup}>
          <div>
            <PersonOutlineOutlined style={{ height: 30, width: 30, color: '#495057', cursor: 'pointer' }} />
          </div>
          <div>
            <FavoriteBorderOutlined style={{ height: 30, width: 30, color: '#495057', cursor: 'pointer' }} />
          </div>
          <div>
            <Badge badgeContent={4} color="error">
              <LocalMallOutlined color="action" style={{ height: 30, width: 30, color: '#495057', cursor: 'pointer' }} />
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderSearch;
