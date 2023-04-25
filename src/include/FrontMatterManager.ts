export default class FrontMatterManager {
  static setupArcanaFrontMatter(frontMatter: any) {
    if (frontMatter.arcana === undefined) {
      frontMatter.arcana = {};
    }
  }
}
