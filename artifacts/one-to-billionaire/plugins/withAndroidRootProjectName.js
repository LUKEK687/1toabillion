const { withSettingsGradle } = require("expo/config-plugins");

/**
 * Expo's Android prebuild writes `rootProject.name = '<app name>'` into
 * settings.gradle by substituting the app's display name into a JS
 * `String.replace()` replacement argument. When the display name contains a
 * `$` followed by digits (e.g. "$1 to Billionaire"), JS interprets `$1` as a
 * regex capture-group backreference in that replacement string instead of
 * literal text, silently dropping it and corrupting the generated Groovy
 * file (`rootProject.name = '' to Billionaire'`), which fails to parse.
 *
 * This plugin runs after prebuild's own settings.gradle mutation and
 * rewrites the `rootProject.name` line to a Gradle-identifier-safe value
 * derived from the app slug, which contains no characters that are special
 * to Groovy or to JS's replacement-string syntax. This does not change the
 * app's user-visible display name (from `name` in app.json) or its Android
 * package id (from `android.package`) -- only the internal Gradle project
 * identifier, which end users never see.
 */
function withAndroidRootProjectName(config) {
  return withSettingsGradle(config, (mod) => {
    const safeName = String(config.slug || "app").replace(/[^A-Za-z0-9_-]/g, "-");
    mod.modResults.contents = mod.modResults.contents.replace(
      /^rootProject\.name\s*=.*$/m,
      `rootProject.name = '${safeName}'`,
    );
    return mod;
  });
}

module.exports = withAndroidRootProjectName;
