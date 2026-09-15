const { withAndroidStyles } = require("expo/config-plugins");

module.exports = function withDarkTheme(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style;

    const appTheme = styles.find((s) => s.$.name === "AppTheme");
    if (appTheme) {
      appTheme.$.parent = "Theme.AppCompat.DayNight.NoActionBar";
    }

    const splashTheme = styles.find((s) => s.$.name === "Theme.App.SplashScreen");
    if (splashTheme) {
      splashTheme.$.parent = "Theme.SplashScreen";
      const bgItem = splashTheme.item.find(
        (i) => i.$.name === "windowSplashScreenBackground"
      );
      if (bgItem) bgItem._ = "@color/splashscreen_background";
    }

    return config;
  });
};
