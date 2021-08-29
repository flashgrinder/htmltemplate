module.exports = {
	filename: "_smart-grid",
	outputStyle: 'scss',
	columns: 12,
	offset: "30px",
	container: {
		maxWidth: "1920px",
		fields: "30px"
	},
	breakPoints: {
		medium: {
				width: '1200px',
		},
		tablet: {
				width: '1024px'
		},
		mobile: {
				width: "767px",
				offset: "15px",
				fields: "15px"
		},
		mobileXL: {
				width: "567px"
		},
		mobileXS: {
				width: "400px"
		}
	},
	mobileFirst: false
};