// tweak the incomplete lib.dom.d.ts for MSIE
/// <reference path="./1.5.0a/lib.dom.d.ts" />

interface MSWindowModeless extends Window {
    dialogTop: any;
    dialogLeft: any;
    dialogWidth: any;
    dialogHeight: any;
    menuArguments: any;
}
interface MSWindowExtensions {
    showModelessDialog(url?: string, argument?: any, options?: any): MSWindowModeless;
}

interface EventListener {
    (evt: MSEventObj): void;
}

interface HTMLTableElement {
    /**
      * Creates a new row (tr) in the table, and adds the row to the rows collection.
      * @param index Number that specifies where to insert the row in the rows collection. The default value is -1, which appends the new row to the end of the rows collection.
      */
    insertRow(index?: number): HTMLTableRowElement;
}

interface HTMLTableRowElement {
    /**
      * Creates a new cell in the table row, and adds the cell to the cells collection.
      * @param index Number that specifies where to insert the cell in the tr. The default value is -1, which appends the new cell to the end of the cells collection.
      */
    insertCell(index?: number): HTMLTableCellElement;
}

interface HTMLCollection {
    (vIndex: number | string, iSubIndex?:number): HTMLCollection | HTMLElement;
}

interface ChildNode extends Node {
    /**
     * Inserts nodes just after node, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    after(...nodes: (Node | string)[]): void;
    /**
     * Inserts nodes just before node, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    before(...nodes: (Node | string)[]): void;
    /** Removes node. */
    remove(): void;
    /**
     * Replaces node with nodes, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    replaceWith(...nodes: (Node | string)[]): void;
}
interface GetRootNodeOptions {
    composed?: boolean;
}
interface ParentNode extends Node {
    readonly childElementCount: number;
    /** Returns the child elements. */
    readonly children: HTMLCollection;
    /** Returns the first child that is an element, and null otherwise. */
    readonly firstElementChild: Element | null;
    /** Returns the last child that is an element, and null otherwise. */
    readonly lastElementChild: Element | null;
    /**
     * Inserts nodes after the last child of node, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    append(...nodes: (Node | string)[]): void;
    /**
     * Inserts nodes before the first child of node, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    prepend(...nodes: (Node | string)[]): void;

    /**
     * Replace all children of node with nodes, while replacing strings in nodes with equivalent Text nodes.
     *
     * Throws a "HierarchyRequestError" DOMException if the constraints of the node tree are violated.
     */
    replaceChildren(...nodes: (Node | string)[]): void;
}
/** Node is an interface from which a number of DOM API object types inherit. It allows those types to be treated similarly; for example, inheriting the same set of methods, or being tested in the same way. */
type Node = {
    /** Returns node's node document's document base URL. */
    readonly baseURI: string;
    /** Returns the children. */
    readonly childNodes: NodeListOf<ChildNode>;
    /** Returns the first child. */
    readonly firstChild: ChildNode | null;
    /** Returns true if node is connected and false otherwise. */
    readonly isConnected: boolean;
    /** Returns the last child. */
    readonly lastChild: ChildNode | null;
    /** Returns the next sibling. */
    readonly nextSibling: ChildNode | null;
    /** Returns a string appropriate for the type of node. */
    readonly nodeName: string;
    /** Returns the type of node. */
    readonly nodeType: number;
    nodeValue: string | null;
    /** Returns the node document. Returns null for documents. */
    readonly ownerDocument: Document | null;
    /** Returns the parent element. */
    readonly parentElement: HTMLElement | null;
    /** Returns the parent. */
    readonly parentNode: ParentNode | null;
    /** Returns the previous sibling. */
    readonly previousSibling: ChildNode | null;
    textContent: string | null;
    appendChild<T extends Node>(node: T): T;
    /** Returns a copy of node. If deep is true, the copy also includes the node's descendants. */
    cloneNode(deep?: boolean): Node;
    /** Returns a bitmask indicating the position of other relative to node. */
    compareDocumentPosition(other: Node): number;
    /** Returns true if other is an inclusive descendant of node, and false otherwise. */
    contains(other: Node | null): boolean;
    /** Returns node's root. */
    getRootNode(options?: GetRootNodeOptions): Node;
    /** Returns whether node has children. */
    hasChildNodes(): boolean;
    insertBefore<T extends Node>(node: T, child: Node | null): T;
    isDefaultNamespace(namespace: string | null): boolean;
    /** Returns whether node and otherNode have the same properties. */
    isEqualNode(otherNode: Node | null): boolean;
    isSameNode(otherNode: Node | null): boolean;
    lookupNamespaceURI(prefix: string | null): string | null;
    lookupPrefix(namespace: string | null): string | null;
    /** Removes empty exclusive Text nodes and concatenates the data of remaining contiguous exclusive Text nodes into the first of their nodes. */
    normalize(): void;
    removeChild<T extends Node>(child: T): T;
    replaceChild<T extends Node>(node: Node, child: T): T;
    /** node is an element. */
    readonly ELEMENT_NODE: 1;
    readonly ATTRIBUTE_NODE: 2;
    /** node is a Text node. */
    readonly TEXT_NODE: 3;
    /** node is a CDATASection node. */
    readonly CDATA_SECTION_NODE: 4;
    readonly ENTITY_REFERENCE_NODE: 5;
    readonly ENTITY_NODE: 6;
    /** node is a ProcessingInstruction node. */
    readonly PROCESSING_INSTRUCTION_NODE: 7;
    /** node is a Comment node. */
    readonly COMMENT_NODE: 8;
    /** node is a document. */
    readonly DOCUMENT_NODE: 9;
    /** node is a doctype. */
    readonly DOCUMENT_TYPE_NODE: 10;
    /** node is a DocumentFragment node. */
    readonly DOCUMENT_FRAGMENT_NODE: 11;
    readonly NOTATION_NODE: 12;
    /** Set when node and other are not in the same tree. */
    readonly DOCUMENT_POSITION_DISCONNECTED: 0x01;
    /** Set when other is preceding node. */
    readonly DOCUMENT_POSITION_PRECEDING: 0x02;
    /** Set when other is following node. */
    readonly DOCUMENT_POSITION_FOLLOWING: 0x04;
    /** Set when other is an ancestor of node. */
    readonly DOCUMENT_POSITION_CONTAINS: 0x08;
    /** Set when other is a descendant of node. */
    readonly DOCUMENT_POSITION_CONTAINED_BY: 0x10;
    readonly DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 0x20;
}
