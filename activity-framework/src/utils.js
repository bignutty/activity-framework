//https://stackoverflow.com/a/326076
module.exports.areWeInFrame = () => {
  try {
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}