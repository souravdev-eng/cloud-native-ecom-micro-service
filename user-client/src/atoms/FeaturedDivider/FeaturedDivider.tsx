import React from 'react';

const FeaturedDivider = ({ title }: { title: string }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#fbfbfb',
      }}>
      <div
        style={{
          flexGrow: 1,
          height: '1px',
          backgroundColor: '#868e96',
          marginRight: '12px',
        }}
      />
      <h3 style={{ margin: '0 12px', color: '#868e96' }}>{title}</h3>
      <div
        style={{
          flexGrow: 1,
          height: '1px',
          backgroundColor: '#868e96',
          marginLeft: '12px',
        }}
      />
    </div>
  );
};

export default FeaturedDivider;
