const createInitial = require("@postcss/postcss-initialize-plugin");

module.exports = function postcssInitial(opts) {
  const transform = createInitial(opts);
  return {
    postcssPlugin: "postcss-initial",
    Once(root) {
      transform(root);
    },
  };
};

module.exports.postcss = true;
