import { Box } from '@mui/material'
import logo from '../../assets/logo.png'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalMallIcon from '@mui/icons-material/LocalMall';
// import FavoriteIcon from '@mui/icons-material/Favorite';

const Header = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-around', alignItems: 'center', width: '100%',
            alignSelf: 'center',
            margin: "0px auto",
            padding: "10px 0px"
        }}>
            <Box>
                <img src={logo} style={{ height: 50, width: 50 }} />
            </Box>
            <Box sx={{ width: '80%', display: 'flex', alignItems: 'center', gap: "20px" }}>
                <input type="text" placeholder='search' style={{ width: '70%', height: '40px', padding: '10px', borderRadius: '18px' }} />
                <Box>
                    <FavoriteBorderIcon style={{ fontSize: 30, marginRight: '8px' }} />
                    <LocalMallIcon style={{ fontSize: 30 }} />
                </Box>
            </Box>
        </div>
    )
}

export default Header