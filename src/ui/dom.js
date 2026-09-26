/** Elements by id within one document. */
export class Elements {
  constructor(doc) {
    this.doc = doc;
  }

  get(id) {
    const el = this.doc.getElementById(id);
    if (!el) throw new Error(`The page has no #${id}.`);
    return el;
  }

  create(tag) {
    return this.doc.createElement(tag);
  }
}
