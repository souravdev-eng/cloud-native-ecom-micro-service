import React from 'react';

import { Skeleton, Box } from '@mui/material';

const ProductSkeleton = () => {
  return (
    <div style={{ maxWidth: 345 }}>
      <Skeleton variant='rectangular' width={245} height={118} />
      <Box sx={{ pt: 0.5 }}>
        <Skeleton sx={{ maxWidth: 220 }} />
        <Skeleton width='50%' />
      </Box>
    </div>
  );
};

export default ProductSkeleton;
