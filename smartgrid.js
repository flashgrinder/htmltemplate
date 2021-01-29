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
	large: {
			width: '1919px'
		},
		medium: {
				width: '1279px'
		},
		tablet: {
				width: '1023px'
		},
		mobile: {
				width: "767px",
				offset: "20px",
				fields: "10px"
		}
	},
	mobileFirst: false
};