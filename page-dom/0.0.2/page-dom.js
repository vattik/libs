/*
 * PageDOM JavaScript Library
 * https://github.com/vattik/libs/tree/main/page-dom
 * Date: 2021-01-25
 */

{
    const LIB = globalThis.PageDOM || {};
    LIB.version = '0.0.2';

    const document = globalThis.document;
    const XPathResult = globalThis.XPathResult;

    const xpathQuery = function(xpath, root = null) {
        if (root === null) root = document;
        const evaluator = new XPathEvaluator();
        const expression = evaluator.createExpression(xpath);
        const xpathResult = expression.evaluate(root, XPathResult.UNORDERED_NODE_ITERATOR_TYPE);
        const result = [];
        let node = xpathResult.iterateNext();
        while (node) {
            result.push(node);
            node = xpathResult.iterateNext();
        }
        return result;
    };

    const findSingleNode = function(xpath, root = null, allowEmpty = true, regexp = null, clean = true) {
        const nodes = xpathQuery(xpath, root);
        if (nodes.length === 0) {
            console.log('node not found: ' + xpath);
            return null;
        }
        if (nodes.length !== 1) {
            console.log(`multiple (${nodes.length}) nodes found: ${xpath}, expected single node`);
            return null;
        }
        let nodeText = clean ? cleanXMLValue(nodes[0].textContent) : nodes[0].textContent;
        if (regexp !== null) {
            const matches = regexp.exec(nodeText);
            if (matches === null) {
                console.log(`no match: [${nodeText}] with [${regexp}]`);
                return null;
            } else if (matches && matches.length === 1) {
                nodeText = matches[0];
            } else if (matches && matches.length > 1) {
                nodeText = matches[1];
            }
        }
        if (nodeText === '' && !allowEmpty) {
            console.log('node empty: ' + xpath);
            return null;
        }
        return nodeText;
    };

    const findNodes = function(xpath, root = null, regexp = null, clean = true) {
        const nodes = xpathQuery(xpath, root);
        if (nodes.length === 0) {
            console.log('nodes not found: ' + xpath);
            return [];
        }
        const result = [];
        for (const node of nodes) {
            const nodeText = clean ? cleanXMLValue(node.textContent) : node.textContent;
            if (regexp !== null) {
                const matches = regexp.exec(nodeText);
                if (matches === null) {
                    console.log(`no match: [${nodeText}] with [${regexp}]`);
                    result.push(null);
                } else if (matches && matches.length === 1) {
                    result.push(matches[0]);
                } else if (matches && matches.length > 1) {
                    result.push(matches[1]);
                }
            } else {
                result.push(nodeText);
            }
        }
        console.log(`found ${nodes.length} nodes: ${xpath}`);
        return result;
    };

    const cleanXMLValue = function(s) {
        s = s.replace(/\s+/g, ' ');
        s = s.replace(/^\s+/, '').replace(/\s+$/, ''); // trim
        return s;
    };

    LIB.xpathQuery = xpathQuery;
    LIB.findSingleNode = findSingleNode;
    LIB.findNodes = findNodes;
    globalThis.PageDOM = LIB;
}
