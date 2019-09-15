MathJax = {
	loader: {
		// The elements to typeset (default is document body)
		elements: null,
		// Perform initial typeset?
		typeset: true,
		// Called when components are loaded
		ready: Startup.defaultReady.bind(Startup),
		// Called when MathJax and page are ready
		pageReady: Startup.defaultPageReady.bind(Startup)
	},
	// disable contextual menu:
	options: {
		renderActions: {
			addMenu: [0, '', '']
		},
		skipHtmlTags: ['svg','script','noscript','style','textarea','pre','code']
	},
	svg: {
		fontCache: 'none'
	},
	tex: {
		inlineMath: [['\\(','\\)']],
		displayMath: [['\\[','\\]']],
		skipHtmlTags: ['svg','script','noscript','style','textarea','pre','code'],
		processEnvironments: false,
		macros: {
			bbA: '{\\mathbb{A}}',
			bbB: '{\\mathbb{B}}',
			bbF: '{\\mathbb{F}}',
			bbN: '{\\mathbb{N}}',
			bbP: '{\\mathbb{P}}',
			bbQ: '{\\mathbb{Q}}',
			bbR: '{\\mathbb{R}}',
			bbZ: '{\\mathbb{Z}}',

			calA: '{\\mathcal{A}}',
			calB: '{\\mathcal{B}}',
			calC: '{\\mathcal{C}}',
			calD: '{\\mathcal{D}}',
			calF: '{\\mathcal{F}}',
			calG: '{\\mathcal{G}}',
			calI: '{\\mathcal{I}}',
			calM: '{\\mathcal{M}}',
			calN: '{\\mathcal{N}}',
			calO: '{\\mathcal{O}}',
			calR: '{\\mathcal{R}}',
			calS: '{\\mathcal{S}}',

			bfA: '{\\mathbf{A}}',
			bfa: '{\\mathbf{a}}',
			bfb: '{\\mathbf{b}}',
			bfc: '{\\mathbf{c}}',
			bfe: '{\\mathbf{e}}',
			bfw: '{\\mathbf{w}}',
			bfx: '{\\mathbf{x}}',
			bfy: '{\\mathbf{y}}',
			bfz: '{\\mathbf{z}}',

			floor: ['{\\left\\lfloor #1 \\right\\rfloor}', 1],
			ceil: ['{\\left\\lceil #1 \\right\\rceil}', 1],

			le: '\\leqslant',
			ge: '\\geqslant',
			hat: '\\widehat',
			emptyset: '\\varnothing',
			epsilon: '\\varepsilon',
			step: ['\\class{fragment step}{#1}', 1],
			zoomable: ['\\class{zoomable}{#1}', 1],
			green: ['\\class{green}{#1}', 1],
			red: ['\\class{red}{#1}', 1]
		}
	}
};