module.exports = {
	filename: "_smart-grid",
	outputStyle: 'scss',
	columns: 12,
	offset: "30px",
	container: {
		maxWidth: "1280px",
		fields: "30px"
	},
	breakPoints: {
        xl: {
                width: '1200px'
        },
        xls: {
                width: '1024px'
        },
        lg: {
                width: "992px"
        },
        md: {
                width: "768px",
                offset: "20px",
                fields: "10px"
        },
        sm: {
                width: "576px",
                offset: "10px",
                fields: "5px"
        },
        xs: {
                width: "400px",
                offset: "10px",
                fields: "10px"
        }
	},
	mobileFirst: false
};