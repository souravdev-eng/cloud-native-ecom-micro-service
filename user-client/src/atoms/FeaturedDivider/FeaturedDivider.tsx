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
                    backgroundColor: '#dee2e6',
                    marginRight: '12px',
                }}
            />
            <h3 style={{ margin: '0 12px', color: '#212529' }}>{title}</h3>
            <div
                style={{
                    flexGrow: 1,
                    height: '1px',
                    backgroundColor: '#dee2e6',
                    marginLeft: '12px',
                }}
            />
        </div>
    );
};

export default FeaturedDivider;
