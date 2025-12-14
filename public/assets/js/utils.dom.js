// Simple DOM utilities used by various UI modules
(function(){
	function escapeHtml(input){
		const s = String(input ?? '');
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function $(selector, scope){
		return (scope || document).querySelector(selector);
	}

	function el(tag, attrs={}, children){
		const node = document.createElement(tag);
		for (const [k,v] of Object.entries(attrs || {})){
			if (k === 'class' || k === 'className') node.className = v;
			else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
			else if (k.startsWith('data-')) node.setAttribute(k, v);
			else if (k in node) node[k] = v;
			else node.setAttribute(k, v);
		}
		if (children != null){
			const arr = Array.isArray(children) ? children : [children];
			for (const c of arr){ node.append(c instanceof Node ? c : document.createTextNode(String(c))); }
		}
		return node;
	}

	globalThis.DomUtils = { escapeHtml, $, el };
})();
