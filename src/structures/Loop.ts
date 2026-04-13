import { Node } from "./Node";

export class Loop<T> {
  private head: Node<T> | null;
  private tail: Node<T> | null;
  private current: Node<T> | null;
  private length: number;
  private isCircular: boolean;
  private readonly getNodeId: (item: T) => string;

  constructor(getNodeId: (item: T) => string, isCircular = false) {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.length = 0;
    this.isCircular = isCircular;
    this.getNodeId = getNodeId;
  }

  public insertAtStart(value: T): Node<T> {
    const newNode = new Node(value);

    if (this.head === null || this.tail === null) {
      this.head = newNode;
      this.tail = newNode;
      this.current ??= newNode;
      this.length += 1;
      this.syncCircularLinks();
      return newNode;
    }

    newNode.next = this.head;
    this.head.prev = newNode;
    this.head = newNode;

    if (this.current === null) {
      this.current = newNode;
    }

    this.length += 1;
    this.syncCircularLinks();
    return newNode;
  }

  public insertAtEnd(value: T): Node<T> {
    const newNode = new Node(value);

    if (this.head === null || this.tail === null) {
      this.head = newNode;
      this.tail = newNode;
      this.current ??= newNode;
      this.length += 1;
      this.syncCircularLinks();
      return newNode;
    }

    newNode.prev = this.tail;
    this.tail.next = newNode;
    this.tail = newNode;

    if (this.current === null) {
      this.current = newNode;
    }

    this.length += 1;
    this.syncCircularLinks();
    return newNode;
  }

  public insertAtPosition(index: number, value: T): Node<T> {
    if (index <= 0 || this.head === null || this.tail === null) {
      return this.insertAtStart(value);
    }

    if (index >= this.length) {
      return this.insertAtEnd(value);
    }

    const target = this.getNodeAt(index);

    if (target === null) {
      return this.insertAtEnd(value);
    }

    const newNode = new Node(value);
    const leftNode = target.prev;

    newNode.prev = leftNode;
    newNode.next = target;

    if (leftNode !== null) {
      leftNode.next = newNode;
    }

    target.prev = newNode;

    this.length += 1;
    this.syncCircularLinks();

    return newNode;
  }

  public removeById(id: string): T | null {
    const node = this.findNodeById(id);

    if (node === null) {
      return null;
    }

    const removedValue = node.value;
    const nextNode = this.getLinearNext(node);
    const previousNode = this.getLinearPrev(node);

    if (this.length === 1) {
      this.head = null;
      this.tail = null;
      this.current = null;
      this.length = 0;
      node.next = null;
      node.prev = null;
      return removedValue;
    }

    if (node === this.head) {
      this.head = nextNode;
    }

    if (node === this.tail) {
      this.tail = previousNode;
    }

    if (previousNode !== null) {
      previousNode.next = nextNode;
    }

    if (nextNode !== null) {
      nextNode.prev = previousNode;
    }

    if (this.current === node) {
      this.current = nextNode ?? previousNode ?? null;
    }

    node.next = null;
    node.prev = null;

    this.length -= 1;
    this.syncCircularLinks();

    return removedValue;
  }

  public getNext(): T | null {
    if (this.current === null) {
      return null;
    }

    const nextNode = this.getTraversalNext(this.current);

    if (nextNode === null) {
      return null;
    }

    this.current = nextNode;
    return this.current.value;
  }

  public getPrevious(): T | null {
    if (this.current === null) {
      return null;
    }

    const previousNode = this.getTraversalPrev(this.current);

    if (previousNode === null) {
      return null;
    }

    this.current = previousNode;
    return this.current.value;
  }

  public getCurrent(): T | null {
    return this.current?.value ?? null;
  }

  public setCurrentById(id: string): T | null {
    const node = this.findNodeById(id);

    if (node === null) {
      return null;
    }

    this.current = node;
    return node.value;
  }

  public toggleCircular(): void {
    this.isCircular = !this.isCircular;
    this.syncCircularLinks();
  }

  public toArray(): T[] {
    const items: T[] = [];
    let cursor = this.head;

    for (let index = 0; index < this.length && cursor !== null; index += 1) {
      items.push(cursor.value);
      cursor = this.getLinearNext(cursor);
    }

    return items;
  }

  public clear(): void {
    let cursor = this.head;

    for (let index = 0; index < this.length && cursor !== null; index += 1) {
      const nextNode = this.getLinearNext(cursor);
      cursor.next = null;
      cursor.prev = null;
      cursor = nextNode;
    }

    this.head = null;
    this.tail = null;
    this.current = null;
    this.length = 0;
  }

  public size(): number {
    return this.length;
  }

  public isEmpty(): boolean {
    return this.length === 0;
  }

  private findNodeById(id: string): Node<T> | null {
    let cursor = this.head;

    for (let index = 0; index < this.length && cursor !== null; index += 1) {
      if (this.getNodeId(cursor.value) === id) {
        return cursor;
      }

      cursor = this.getLinearNext(cursor);
    }

    return null;
  }

  private getNodeAt(index: number): Node<T> | null {
    if (index < 0 || index >= this.length) {
      return null;
    }

    let cursor = this.head;

    for (let currentIndex = 0; currentIndex < index && cursor !== null; currentIndex += 1) {
      cursor = this.getLinearNext(cursor);
    }

    return cursor;
  }

  private getTraversalNext(node: Node<T>): Node<T> | null {
    if (this.isCircular) {
      return node.next;
    }

    if (node === this.tail) {
      return null;
    }

    return node.next;
  }

  private getTraversalPrev(node: Node<T>): Node<T> | null {
    if (this.isCircular) {
      return node.prev;
    }

    if (node === this.head) {
      return null;
    }

    return node.prev;
  }

  private getLinearNext(node: Node<T>): Node<T> | null {
    if (node === this.tail) {
      return null;
    }

    return node.next;
  }

  private getLinearPrev(node: Node<T>): Node<T> | null {
    if (node === this.head) {
      return null;
    }

    return node.prev;
  }

  private syncCircularLinks(): void {
    if (this.head === null || this.tail === null) {
      return;
    }

    if (this.isCircular) {
      this.head.prev = this.tail;
      this.tail.next = this.head;
      return;
    }

    this.head.prev = null;
    this.tail.next = null;
  }
}
