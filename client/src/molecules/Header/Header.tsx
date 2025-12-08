import { Box, Badge } from '@mui/material'
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import { useCart } from '../../pages/Cart/Cart.hook';

const Header = () => {
    const navigate = useNavigate();
    const { getTotalItems } = useCart();

    const handleLogoClick = () => {
        navigate('/');
    };

    const handleCartClick = () => {
        navigate('/cart');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            width: '100%',
            alignSelf: 'center',
            margin: "0px auto",
            padding: "10px 0px"
        }}>
            <Box sx={{ cursor: 'pointer' }} onClick={handleLogoClick}>
                <img src={logo} style={{ height: 50, width: 50 }} alt="Logo" />
            </Box>
            <Box sx={{ width: '80%', display: 'flex', alignItems: 'center', gap: "20px" }}>
                <input type="text" placeholder='search' style={{ width: '70%', height: '40px', padding: '10px', borderRadius: '18px' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FavoriteBorderIcon style={{ fontSize: 30 }} />
                    <Box
                        sx={{ cursor: 'pointer' }}
                        onClick={handleCartClick}
                    >
                        <Badge badgeContent={getTotalItems()} color="primary">
                            <LocalMallIcon style={{ fontSize: 30 }} />
                        </Badge>
                    </Box>
                </Box>
            </Box>
        </div>
    )
}

export default Header