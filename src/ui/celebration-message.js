/** What the congratulations say: the heading, how far and how long, and the way back to the map. */
export class CelebrationMessage {
  constructor(words, formats, summary) {
    this.words = words;
    this.formats = formats;
    this.summary = summary;
  }

  title() {
    return this.words.congratulations;
  }

  text() {
    // The time reads as one phrase, so a narrow card breaks before it rather than inside it.
    const time = this.formats.span(this.summary.ms()).replaceAll(' ', ' ');
    return this.words.teamRan(this.formats.km(this.summary.km()), time);
  }

  close() {
    return this.words.backToMap;
  }
}
