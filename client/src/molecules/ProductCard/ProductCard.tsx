import { Box, Typography } from '@mui/material'

const ProductCard = () => {
    return (
        <Box sx={{ width: 300, border: '1px solid #000', display: 'flex', flexDirection: 'column', borderRadius: 6, padding: 1 }}>
            <Box sx={{ width: '100%', height: 170, backgroundColor: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', borderRadius: 6, marginBottom: '6px' }}>
                <img src={"https://static.nike.com/a/images/t_web_pdp_936_v2/f_auto/e783e052-9360-4afb-adb8-c4e9c0f5db07/NIKE+AIR+MAX+NUAXIS.png"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </Box>
            <Box>
                <span style={{ fontSize: 10, backgroundColor: '#ebfbee', borderRadius: 16, color: '#2b8a3e', padding: '4px 10px', fontWeight: '600' }}>
                    Best seller
                </span>
                <Typography sx={{ margin: '6px 0px' }}>Dunk High "Green stain" Senakers</Typography>
                <Typography>$180.00</Typography>
                <Box sx={{ height: 40, backgroundColor: '#000', textAlign: 'center', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 14, marginTop: '12px', marginBottom: '6px', cursor: 'pointer' }}>
                    <Typography>Add To Cart</Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default ProductCard